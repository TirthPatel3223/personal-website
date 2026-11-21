"""Lay out a theme park for the Mapblazer 3D exhibit, from the route solver's data.

The route solver's data (TirthPatel3223/Mapblazer_Route_Optimization_Algorithm,
data/parks.json + data/walk_times.json) has no ride coordinates, only a walk-minute
matrix. Weighted SMACOF (metric MDS) finds 2D positions whose distances match those
walking times. Off-diagonal zeros look like missing values (Big Thunder Mountain to
Jungle Cruise is not a 0-minute walk), so they get zero weight instead of pulling
rides onto one point.

Those positions only seed the display layout. Many rides are a few steps apart, so a
faithful layout is a pile of overlapping models. Instead every ride gets its own plot:
a capacity-constrained power diagram (weighted Voronoi) of the park, where bigger
rides get bigger plots and each plot drifts from its walking-time position only as
far as it needs to. Walkways run along the plot borders, the entrance plaza sits at
the front with the gate, and every ride's queue starts on the walkway nearest it.
The exhibit labels the result "not a map".

Each leg of the solver's example day also gets its real walking minutes (including
the walk back to the gate), so the exhibit's clock matches the README's 350-minute day.

    python -I -X utf8 scripts/3d/build-park-layout.py            # downloads from GitHub
    python -I -X utf8 scripts/3d/build-park-layout.py <dir>      # reads parks.json/walk_times.json
    python -I -X utf8 scripts/3d/build-park-layout.py <dir> --plot out.png

Output: public/data/park/disneyland.json
"""

import json
import math
import os
import sys
import urllib.request

import numpy as np

REPO = "https://raw.githubusercontent.com/TirthPatel3223/Mapblazer_Route_Optimization_Algorithm/master/data"
PARK = "disneyland"
OUT = os.path.join(os.getcwd(), "public", "data", "park", f"{PARK}.json")

# The README's worked example (also on the route-optimisation page). Names are as
# stored in the data, including the deliberate join-key spelling "Carbbean".
ITINERARY = [
    ("Tiana's Bayou Adventure", "09:07", 13, 11),
    ("Matterhorn Bobsleds", "09:33", 23, 2),
    ("Pirates of the Carbbean", "10:00", 18, 16),
    ("Big Thunder Mountain Railroad", "10:35", 27, 4),
    ("Space Mountain", "11:09", 40, 3),
    ("Star Wars: Rise of the Resistance", "11:53", 49, 18),
    ("Indiana Jones Adventure", "14:00", 45, 4),
]

RULES = [
    ("coaster", ["Mountain", "Matterhorn", "oaster", "Incredicoaster"]),
    ("water", ["Bayou", "Canoe", "Submarine", "Jungle Cruise", "Pirates", "Riverboat", "Sailing Ship", "Canal Boat", "small world", "Splash"]),
    ("spinner", ["Tea Party", "Dumbo", "Orbitor", "Carrousel", "Carousel", "Flying"]),
    ("train", ["Railroad", "Monorail", "Train", "Vehicles", "Autopia"]),
    ("show", ["House", "Tiki", "Meet", "Theater", "Theatre", "Lair", "Lincoln", "Gallery", "Magical Life", "Play Yard", "Treehouse"]),
]

# Which generic model stands in for each ride (first match wins). These are ride
# TYPES (a log flume, a mountain coaster, a boat ride), not copies of real landmarks.
VARIANTS = [
    ("Bayou", "flume"),
    ("Matterhorn", "alpine"),
    ("Pirates of", "boathouse"),
    ("Thunder", "minetrain"),
    ("Space Mountain", "dome"),
    ("Rise of the Resistance", "hangar"),
    ("Indiana", "temple"),
    ("GADGET", "woodie"),
    ("Canoe", "canoes"),
    ("small world", "facade"),
    ("Jungle Cruise", "jungle"),
    ("Sailing Ship", "ship"),
    ("Storybook", "canal"),
    ("Submarine", "subs"),
    ("Autopia", "autopia"),
    ("Casey", "circus"),
    ("Monorail", "monorail"),
    ("Main Street Vehicles", "trolley"),
    ("Orbitor", "rockets"),
    ("Dumbo", "flyers"),
    ("Carrousel", "carousel"),
    ("Tea Party", "teacups"),
    ("Treehouse", "treehouse"),
    ("Tom Sawyer", "fort"),
    ("Mickey's House", "cottage"),
    ("Play Yard", "playground"),
    ("Tiki", "tiki"),
    ("Lincoln", "theater"),
    ("Gallery", "theater"),
    ("Magical Life", "theater"),
    ("Buzz", "scifi"),
    ("Star Tours", "scifi"),
    ("Millenium", "scifi"),
    ("Roger Rabbit", "toon"),
    ("Runaway Railway", "toon"),
    ("Pooh", "toon"),
]
DEFAULT_VARIANT = {"dark": "storybook", "show": "theater", "spinner": "flyers", "water": "canoes", "coaster": "woodie", "train": "circus"}

# Footprint radius of each model in world units (people are 0.36 tall). The exhibit's
# ride builders are drawn to these sizes: keep the two tables in step.
HERO = {"flume", "alpine", "boathouse", "minetrain", "dome", "hangar", "temple"}
MID = {"woodie", "canoes", "facade", "jungle", "ship", "canal", "subs", "autopia", "monorail", "treehouse", "fort"}
R_HERO, R_MID, R_SMALL, R_PLAZA = 3.6, 2.8, 2.2, 5.0
PATH_HALF = 0.55  # half a walkway's width
MARGIN = 1.3  # extra plot radius per ride: walkway, queue and a little lawn
SHORT_EDGE = 1.1  # walkway segments shorter than this are merged into a junction


def radius_of(variant):
    if variant in HERO:
        return R_HERO
    if variant in MID:
        return R_MID
    return R_SMALL


def load(name):
    if len(sys.argv) > 1 and not sys.argv[1].startswith("--"):
        with open(os.path.join(sys.argv[1], name), encoding="utf-8") as f:
            return json.load(f)
    with urllib.request.urlopen(f"{REPO}/{name}") as r:
        return json.loads(r.read().decode("utf-8"))


def archetype(name):
    for kind, words in RULES:
        if any(w.lower() in name.lower() for w in words):
            return kind
    return "dark"


def variant_of(name, kind):
    for word, v in VARIANTS:
        if word.lower() in name.lower():
            return v
    return DEFAULT_VARIANT[kind]


def smacof(D, W, X, iters=600):
    n = len(D)
    V = -W.copy()
    np.fill_diagonal(V, 0)
    np.fill_diagonal(V, -V.sum(axis=1))
    Vp = np.linalg.pinv(V)
    for _ in range(iters):
        d = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(-1))
        with np.errstate(divide="ignore", invalid="ignore"):
            B = np.where(d > 1e-9, -W * D / d, 0.0)
        np.fill_diagonal(B, 0)
        np.fill_diagonal(B, -B.sum(axis=1))
        X = Vp @ B @ X
    d = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(-1))
    iu = np.triu_indices(n, 1)
    stress = np.sqrt((W[iu] * (D[iu] - d[iu]) ** 2).sum() / (W[iu] * D[iu] ** 2).sum())
    return X, stress


def walk_layout(ids, walk):
    """Metric MDS of the walk-minute matrix, entrance towards +z."""
    n = len(ids)
    M = np.array([[float(walk[a].get(b, 0.0)) for b in ids] for a in ids])
    D = np.zeros((n, n))
    W = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            vals = [v for v in (M[i, j], M[j, i]) if v > 0]
            if vals:
                D[i, j] = sum(vals) / len(vals)
                W[i, j] = 1.0
    missing = int((W == 0).sum() - n)
    F = np.where(W > 0, D, np.median(D[W > 0]))
    np.fill_diagonal(F, 0)
    J = np.eye(n) - 1.0 / n
    vals, vecs = np.linalg.eigh(-0.5 * J @ (F**2) @ J)
    order = np.argsort(vals)[::-1][:2]
    X0 = vecs[:, order] * np.sqrt(np.maximum(vals[order], 0))
    X, stress = smacof(D, W, X0)
    X -= np.median(X, axis=0)
    e = X[ids.index("0")]
    rot = np.pi / 2 - np.arctan2(e[1], e[0])
    c, s = np.cos(rot), np.sin(rot)
    X = X @ np.array([[c, s], [-s, c]])
    return X, stress, missing


# ── Power diagram ────────────────────────────────────────────────────────────


def clip(poly, a, b):
    """Keep the part of a convex polygon where a . x <= b."""
    out = []
    n = len(poly)
    for k in range(n):
        P = poly[k]
        Q = poly[(k + 1) % n]
        fp = a[0] * P[0] + a[1] * P[1] - b
        fq = a[0] * Q[0] + a[1] * Q[1] - b
        if fp <= 0:
            out.append(P)
        if (fp < 0 < fq) or (fq < 0 < fp):
            t = fp / (fp - fq)
            out.append((P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])))
    return out


def power_cells(P, w, boundary):
    cells = []
    sq = (P**2).sum(1)
    for i in range(len(P)):
        poly = boundary
        for j in range(len(P)):
            if i == j:
                continue
            a = 2 * (P[j] - P[i])
            b = sq[j] - sq[i] - w[j] + w[i]
            poly = clip(poly, a, b)
            if not poly:
                break
        cells.append(poly)
    return cells


def area_centroid(poly):
    if len(poly) < 3:
        return 0.0, None
    a = cx = cz = 0.0
    for k in range(len(poly)):
        x0, z0 = poly[k]
        x1, z1 = poly[(k + 1) % len(poly)]
        c = x0 * z1 - x1 * z0
        a += c
        cx += (x0 + x1) * c
        cz += (z0 + z1) * c
    a *= 0.5
    if abs(a) < 1e-9:
        return 0.0, None
    return abs(a), np.array([cx / (6 * a), cz / (6 * a)])


def seg_dist(p, a, b):
    ab = b - a
    t = float(np.clip(np.dot(p - a, ab) / max(1e-12, np.dot(ab, ab)), 0, 1))
    return float(np.hypot(*(a + ab * t - p))), t


def spread(A, radii, plaza_xy, R, springs, iters=3000):
    """Push overlapping rides apart while each stays as close as it can to its
    walking-time position (so near neighbours stay neighbours). `springs` are
    (i, j, minutes) for consecutive stops of the solver's example day, with j = -1
    meaning the gate: those pairs are pulled to a length that grows with the walk."""
    X = A.copy()
    s = radii + MARGIN * 0.75
    ps = R_PLAZA + MARGIN
    gate = np.array([0.0, R])
    n = len(X)
    for it in range(iters):
        moved = 0.0
        for i, j, minutes in springs:
            pj = gate if j < 0 else X[j]
            rest = s[i] + (1.0 if j < 0 else s[j]) + 1.5 + 2.6 * minutes
            d = pj - X[i]
            dist = max(1e-9, float(np.hypot(*d)))
            f = 0.04 * (dist - rest) * d / dist
            X[i] += f
            if j >= 0:
                X[j] -= f
        for i in range(n):
            d = X[i + 1 :] - X[i]
            dist = np.hypot(d[:, 0], d[:, 1])
            need = s[i] + s[i + 1 :]
            for k in np.nonzero(dist < need)[0]:
                j = i + 1 + k
                u = d[k] / dist[k] if dist[k] > 1e-9 else np.array([1.0, 0.0])
                push = (need[k] - dist[k]) / 2 * u
                X[i] -= push
                X[j] += push
                moved += need[k] - dist[k]
        # The entrance plaza is fixed: rides make room for it.
        d = X - plaza_xy
        dist = np.hypot(d[:, 0], d[:, 1])
        for i in np.nonzero(dist < s + ps)[0]:
            X[i] += (s[i] + ps - dist[i]) * d[i] / max(dist[i], 1e-9)
        X += 0.004 * (A - X)
        r = np.hypot(X[:, 0], X[:, 1])
        lim = R - s * 0.8
        over = r > lim
        X[over] *= (lim[over] / r[over])[:, None]
    return X


def plots(anchors, radii, plaza_xy, R, iters=400):
    """Capacity-constrained power diagram: one plot per ride, sized to its model."""
    N = 128
    boundary = [(R * math.cos(2 * math.pi * k / N), R * math.sin(2 * math.pi * k / N)) for k in range(N)]
    P = np.vstack([anchors, plaza_xy])
    sizes = np.append(radii, R_PLAZA) + MARGIN
    park_area = 0.5 * N * R * R * math.sin(2 * math.pi / N)
    target = sizes**2 / (sizes**2).sum() * park_area
    w = np.zeros(len(P))
    n = len(anchors)
    for it in range(iters):
        cells = power_cells(P, w, boundary)
        pull = 0.08
        for i, poly in enumerate(cells):
            A, c = area_centroid(poly)
            if c is None:
                # An empty plot: drop its weight and nudge it towards its anchor.
                w[i] = w.min()
                if i < n:
                    P[i] += 0.3 * (anchors[i] - P[i])
                continue
            w[i] += 0.35 * (target[i] - A)
            if i < n:
                P[i] += 0.6 * (c - P[i]) + pull * (anchors[i] - P[i])
            else:
                # The plaza stays on the front axis, against the gate.
                P[i] = [0.0, 0.6 * P[i][1] + 0.4 * c[1]]
        w -= w.mean()
    return P, w, power_cells(P, w, boundary), boundary


# ── Walkways ─────────────────────────────────────────────────────────────────


def walkways(P, cells, R, N_boundary, plaza_index):
    """Interior plot borders become walkways; short segments are merged into junctions."""
    on_rim = R * math.cos(math.pi / N_boundary) - 1e-6

    def rim(p):
        # On the boundary polygon: the point's largest projection onto an edge normal.
        ang = math.atan2(p[1], p[0])
        k = math.floor(ang / (2 * math.pi / N_boundary))
        mid = (k + 0.5) * 2 * math.pi / N_boundary
        return p[0] * math.cos(mid) + p[1] * math.sin(mid) >= on_rim

    verts = []

    def vid(p):
        for k, q in enumerate(verts):
            if abs(q[0] - p[0]) < 1e-5 and abs(q[1] - p[1]) < 1e-5:
                return k
        verts.append((p[0], p[1]))
        return len(verts) - 1

    cell_edges = []
    edges = set()
    for i, poly in enumerate(cells):
        ce = []
        for k in range(len(poly)):
            a = poly[k]
            b = poly[(k + 1) % len(poly)]
            m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            if rim(m):
                continue
            u, v = vid(a), vid(b)
            if u == v:
                continue
            e = (min(u, v), max(u, v))
            edges.add(e)
            ce.append(e)
        cell_edges.append(ce)

    # Merge junctions joined by a very short segment (union-find).
    parent = list(range(len(verts)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in sorted(edges, key=lambda e: math.dist(verts[e[0]], verts[e[1]])):
        if math.dist(verts[a], verts[b]) < SHORT_EDGE:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[rb] = ra
    groups = {}
    for k in range(len(verts)):
        groups.setdefault(find(k), []).append(k)
    new_id = {}
    V = []
    for root, members in groups.items():
        # A junction touching the hedge stays on the hedge.
        on = [m for m in members if rim(verts[m])]
        pts = np.array([verts[m] for m in (on or members)])
        V.append(pts.mean(0))
        for m in members:
            new_id[m] = len(V) - 1
    E = set()
    for a, b in edges:
        u, v = new_id[a], new_id[b]
        if u != v:
            E.add((min(u, v), max(u, v)))
    cell_E = [sorted({(min(new_id[a], new_id[b]), max(new_id[a], new_id[b])) for a, b in ce if new_id[a] != new_id[b]}) for ce in cell_edges]
    return [np.array(v) for v in V], E, cell_E


def main():
    plot_path = None
    if "--plot" in sys.argv:
        plot_path = sys.argv[sys.argv.index("--plot") + 1]
    parks = load("parks.json")
    walk = load("walk_times.json")[PARK]
    park = next(p for p in parks["parks"] if p["park_id"] == PARK)
    rides = {str(r["ride_id"]): r for r in park["rides"]}
    ids = sorted(walk.keys(), key=int)
    X, stress, missing = walk_layout(ids, walk)

    ride_ids = [i for i in ids if i != "0"]
    names = {i: rides[i]["name"] for i in ride_ids}
    kinds = {i: archetype(names[i]) for i in ride_ids}
    variants = {i: variant_of(names[i], kinds[i]) for i in ride_ids}
    radii = np.array([radius_of(variants[i]) for i in ride_ids])

    # Park size: room for every plot at ~86% packing.
    need = np.pi * (((radii + MARGIN) ** 2).sum() + (R_PLAZA + MARGIN) ** 2) / 0.86
    R = math.ceil(math.sqrt(need / np.pi) * 2) / 2

    A = X[[ids.index(i) for i in ride_ids]]
    A = A - np.median(A, axis=0)
    A *= 0.55 * R / np.percentile(np.hypot(A[:, 0], A[:, 1]), 95)
    # Rides that share one placeholder location in the source data start fanned out.
    rng = np.random.default_rng(7)
    A += rng.normal(0, 0.3, A.shape)
    plaza_xy = np.array([0.0, R - R_PLAZA - 1.0])
    by_name = {r["name"]: str(r["ride_id"]) for r in park["rides"]}
    stops = [ride_ids.index(by_name[name]) for name, *_ in ITINERARY]
    chain = [-1] + stops + [-1]
    springs = []
    for a, b in zip(chain, chain[1:]):
        minutes = float(walk[ride_ids[a] if a >= 0 else "0"][ride_ids[b] if b >= 0 else "0"])
        springs.append((b, a, minutes) if a < 0 else (a, b, minutes))
    sp = lambda P: [(round(math.dist(P[i], P[j] if j >= 0 else (0, R)), 1)) for i, j, _ in springs]
    print("leg lengths from walking times alone:", sp(A))
    A = spread(A, radii, plaza_xy, R, springs)

    P, w, cells, boundary = plots(A, radii, plaza_xy, R)
    n = len(ride_ids)
    V, E, cell_E = walkways(P, cells, R, len(boundary), n)

    # Each ride's queue starts on the walkway nearest its plot centre.
    splits = {}
    entries = []
    for i in range(n):
        best = None
        for e in cell_E[i]:
            d, t = seg_dist(P[i], V[e[0]], V[e[1]])
            if best is None or d < best[0]:
                best = (d, t, e)
        d, t, e = best
        t = float(np.clip(t, 0.25, 0.75))
        entries.append((e, t))
        splits.setdefault(e, []).append((t, i))
    entry_vertex = [None] * n
    for e, lst in splits.items():
        E.discard(e)
        chain = [e[0]]
        for t, i in sorted(lst):
            V.append(V[e[0]] + (V[e[1]] - V[e[0]]) * t)
            entry_vertex[i] = len(V) - 1
            chain.append(len(V) - 1)
        chain.append(e[1])
        for a, b in zip(chain, chain[1:]):
            E.add((min(a, b), max(a, b)))

    # Gate on the rim at the front, hub at the plaza, spokes to the plaza's corners.
    gate = len(V)
    V.append(np.array([0.0, R]))
    hub = len(V)
    _, plaza_c = area_centroid(cells[n])
    V.append(np.array([0.0, plaza_c[1]]))
    E.add((gate, hub))
    on_rim = R * math.cos(math.pi / len(boundary)) - 1e-3
    plaza_corners = sorted({v for e in cell_E[n] for v in e if np.hypot(*V[v]) < on_rim})
    for v in plaza_corners:
        E.add((min(hub, v), max(hub, v)))

    # Drop dead ends that lead nowhere (spurs running into the hedge).
    keep = set(entry_vertex) | {gate, hub}
    while True:
        deg = {}
        for a, b in E:
            deg[a] = deg.get(a, 0) + 1
            deg[b] = deg.get(b, 0) + 1
        dead = [v for v, d in deg.items() if d == 1 and v not in keep]
        if not dead:
            break
        E = {e for e in E if e[0] not in dead and e[1] not in dead}

    # Compact the vertex list.
    used = sorted({v for e in E for v in e} | keep)
    remap = {v: k for k, v in enumerate(used)}
    Vout = [[round(float(V[v][0]), 3), round(float(V[v][1]), 3)] for v in used]
    Eout = sorted([[remap[a], remap[b]] for a, b in E])

    # Model scale: shrink a model only if its plot is too tight for it.
    nodes = [
        {
            "id": 0,
            "name": "Entrance",
            "kind": "entrance",
            "variant": "gate",
            "duration": None,
            "x": 0.0,
            "z": round(R, 3),
            "entry": remap[gate],
            "shared": False,
        }
    ]
    tight = []
    for i, rid in enumerate(ride_ids):
        poly = cells[i]
        inr = min(seg_dist(P[i], np.array(poly[k]), np.array(poly[(k + 1) % len(poly)]))[0] for k in range(len(poly)))
        # The rim side only needs a little lawn, walkway sides need the path's half width.
        inr_path = min(seg_dist(P[i], V[a], V[b])[0] for a, b in cell_E[i]) if cell_E[i] else inr
        room = min(inr - 0.25, inr_path - PATH_HALF - 0.2)
        scale = float(np.clip(room / radii[i], 0.72, 1.0))
        if scale < 0.999:
            tight.append((names[rid], round(scale, 2)))
        ev = V[entry_vertex[i]]

        # Slide the model towards its entrance so the queue meets the walkway, as far
        # as the plot allows (keeping clear of every walkway and the hedge).
        size = radii[i] * scale

        def fits(c):
            for k in range(len(poly)):
                a = np.array(poly[k])
                b = np.array(poly[(k + 1) % len(poly)])
                d, _ = seg_dist(c, a, b)
                if d < size + 0.25:
                    return False
            for a, b in cell_E[i]:
                d, _ = seg_dist(c, V[a], V[b])
                if d < size + PATH_HALF + 0.2:
                    return False
            return True

        d = ev - P[i]
        L = float(np.hypot(*d))
        want = L - (PATH_HALF + 0.8 + size)
        lo, hi = 0.0, max(0.0, want)
        if hi > 0 and fits(P[i] + d / L * hi):
            lo = hi
        else:
            for _ in range(20):
                mid = (lo + hi) / 2
                if fits(P[i] + d / L * mid):
                    lo = mid
                else:
                    hi = mid
        C = P[i] + d / L * lo
        P[i] = C
        yaw = math.atan2(ev[0] - C[0], ev[1] - C[1])
        nodes.append(
            {
                "id": int(rid),
                "name": names[rid],
                "kind": kinds[rid],
                "variant": variants[rid],
                "duration": rides[rid]["duration_minutes"],
                "x": round(float(P[i][0]), 3),
                "z": round(float(P[i][1]), 3),
                "r": radii[i],
                "scale": round(scale, 3),
                "yaw": round(yaw, 4),
                "entry": remap[entry_vertex[i]],
                "cell": [[round(x, 3), round(z, 3)] for x, z in poly],
            }
        )

    by_name = {r["name"]: str(r["ride_id"]) for r in park["rides"]}
    itinerary = []
    prev = "0"
    for name, arrive, queue, ride in ITINERARY:
        if name not in by_name:
            raise SystemExit(f"itinerary ride not found in data: {name}")
        rid = by_name[name]
        itinerary.append({"id": int(rid), "arrive": arrive, "queue": queue, "ride": ride, "walk": walk[prev][rid]})
        prev = rid

    island = R + 7.5
    out = {
        "park": park["name"],
        "stress": round(float(stress), 4),
        "missingPairs": missing // 2,
        "radius": R,
        "island": island,
        "plaza": {
            "x": 0.0,
            "z": round(float(plaza_c[1]), 3),
            "cell": [[round(x, 3), round(z, 3)] for x, z in cells[n]],
        },
        "paths": {"v": Vout, "e": Eout, "gate": remap[gate], "hub": remap[hub]},
        "nodes": nodes,
        "itinerary": itinerary,
        "returnWalk": walk[prev]["0"],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{park['name']}: {len(ids)} nodes, {missing // 2} missing pairs, weighted stress {stress:.4f}")
    print(f"park radius {R}, {len(Vout)} junctions, {len(Eout)} walkway segments")
    print("tight plots:", tight)
    print("walk legs:", [s["walk"] for s in itinerary], "return", out["returnWalk"])
    pos = {str(nd["id"]): (nd["x"], nd["z"]) for nd in nodes}
    legs = ["0"] + [str(s["id"]) for s in itinerary] + ["0"]
    print("leg lengths in the layout:", [round(math.dist(pos[a], pos[b]), 1) for a, b in zip(legs, legs[1:])])
    # How well do layout distances still follow walking times (rank correlation)?
    pairs = [(float(walk[a][b]), math.dist(pos[a], pos[b])) for a in ride_ids for b in ride_ids if a < b and float(walk[a].get(b, 0)) > 0]
    wr = np.argsort(np.argsort([p[0] for p in pairs]))
    lr = np.argsort(np.argsort([p[1] for p in pairs]))
    print("spearman(walk minutes, layout distance):", round(float(np.corrcoef(wr, lr)[0, 1]), 3))
    print("wrote", OUT)

    if plot_path:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(10, 10))
        bx = [p[0] for p in boundary] + [boundary[0][0]]
        bz = [p[1] for p in boundary] + [boundary[0][1]]
        ax.plot(bx, bz, color="green")
        for a, b in Eout:
            ax.plot([Vout[a][0], Vout[b][0]], [Vout[a][1], Vout[b][1]], color="#999", lw=3)
        ax.fill([p[0] for p in cells[n]], [p[1] for p in cells[n]], color="#eee")
        for poly in cells:
            ax.plot([p[0] for p in poly] + [poly[0][0]], [p[1] for p in poly] + [poly[0][1]], color="#cde", lw=0.6)
        hero_ids = {by_name[nm] for nm, *_ in ITINERARY}
        for nd in nodes[1:]:
            c = plt.Circle((nd["x"], nd["z"]), nd["r"] * nd["scale"], color="orange" if str(nd["id"]) in hero_ids else "#4a90d9", alpha=0.6)
            ax.add_patch(c)
            ev = Vout[nd["entry"]]
            ax.plot([nd["x"], ev[0]], [nd["z"], ev[1]], color="red", lw=1)
            ax.text(nd["x"], nd["z"], nd["variant"], fontsize=7, ha="center")
        ax.plot([0], [R], "k^")
        ax.set_aspect("equal")
        ax.invert_yaxis()
        fig.savefig(plot_path, dpi=80)


if __name__ == "__main__":
    main()
