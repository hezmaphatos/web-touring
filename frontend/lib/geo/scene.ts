"use client";

import { geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { interpolateZoom } from "d3-interpolate";
import { curveCatmullRom, line } from "d3-shape";
import type { LandData } from "./land";
import { boundsOf, JAVA_BOUNDS, tripPoints, type SceneTrip } from "./route";
import styles from "./scene.module.css";

const NS = "http://www.w3.org/2000/svg";
const MAX_ZOOM = 14;

/** Pan/zoom over the base projection: screen = base * k + (x, y). */
export interface View {
  k: number;
  x: number;
  y: number;
}

/** Area of the SVG left free for the map when something covers part of it (px). */
export interface Frame {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SceneOptions {
  /** Unique per instance; mask ids are built from it. */
  idPrefix: string;
  padding?: number;
  /** Stops are focusable and show their name on focus. */
  interactiveStops?: boolean;
  /** Routes become buttons. */
  onSelect?: (key: string) => void;
}

type Point = [number, number];

interface RouteNodes {
  trip: SceneTrip;
  base: Point[];
  baseStops: Point[];
  group: SVGGElement;
  hit: SVGPathElement | null;
  maskPath: SVGPathElement;
  asphalt: SVGPathElement;
  center: SVGPathElement | null;
  marker: SVGRectElement;
  stops: SVGGElement[];
  progress: number;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number>,
  parent: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);

  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }

  parent.appendChild(node);
  return node;
}

const routeLine = line<Point>().curve(curveCatmullRom.alpha(0.5));

/**
 * The shared map engine. Land is drawn once in a Mercator projection fitted to the visible
 * trips; panning and zooming only change a transform. Routes are re-drawn in screen space so
 * strokes and the dashed center line keep their size at every zoom level.
 *
 * Each route is a black "asphalt" path with a yellow dashed center line on top. Both are
 * revealed by one mask whose dash offset is the draw progress, so they always draw together.
 */
export class RouteScene {
  private width = 0;
  private height = 0;
  private projection: GeoProjection = geoMercator();
  private view: View = { k: 1, x: 0, y: 0 };
  private frame: Frame = { top: 0, right: 0, bottom: 0, left: 0 };
  private frameFor: ((width: number, height: number) => Frame) | null = null;
  private land: LandData | null = null;
  private readonly defs: SVGDefsElement;
  private readonly landGroup: SVGGElement;
  private readonly coast: SVGPathElement;
  private readonly borders: SVGPathElement;
  private readonly routes = new Map<string, RouteNodes>();
  private readonly padding: number;

  constructor(
    private readonly svg: SVGSVGElement,
    trips: SceneTrip[],
    private readonly options: SceneOptions,
  ) {
    this.padding = options.padding ?? 32;
    svg.classList.add(styles.scene);
    this.defs = svgElement("defs", {}, svg);
    this.landGroup = svgElement("g", {}, svg);
    this.borders = svgElement(
      "path",
      { class: styles.borders, "vector-effect": "non-scaling-stroke" },
      this.landGroup,
    );
    this.coast = svgElement(
      "path",
      { class: styles.coast, "vector-effect": "non-scaling-stroke" },
      this.landGroup,
    );

    const routesGroup = svgElement("g", {}, svg);
    trips.forEach((trip, index) => this.createRoute(trip, index, routesGroup));
  }

  get element(): SVGSVGElement {
    return this.svg;
  }

  get keys(): string[] {
    return [...this.routes.keys()];
  }

  get currentView(): View {
    return { ...this.view };
  }

  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  setLand(land: LandData): void {
    this.land = land;
    this.drawLand();
  }

  /** Space covered by overlays (a side panel), per size; fitted views avoid it. */
  setFrameResolver(frameFor: (width: number, height: number) => Frame): void {
    this.frameFor = frameFor;
    this.fit();
  }

  resize(width: number, height: number): void {
    if (width < 1 || height < 1 || (width === this.width && height === this.height)) {
      return;
    }

    this.width = width;
    this.height = height;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.fit();
  }

  /** Fits the base projection to every trip in the scene (Java when there are none). */
  private fit(): void {
    if (this.width < 1) {
      return;
    }

    const { width, height } = this;
    this.frame = this.frameFor?.(width, height) ?? this.frame;
    const all = [...this.routes.values()].flatMap((route) => tripPoints(route.trip));
    const [[west, south], [east, north]] = boundsOf(all, 1.2) ?? JAVA_BOUNDS;
    const pad = this.padding;

    this.projection = geoMercator().fitExtent(
      [
        [pad + this.frame.left, pad + this.frame.top],
        [width - pad - this.frame.right, height - pad - this.frame.bottom],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [west, south],
          [east, north],
        ],
      },
    );

    for (const route of this.routes.values()) {
      route.base = route.trip.coords.map((coord) => this.projection(coord) as Point);
      route.baseStops = route.trip.stops.map((stop) => this.projection(stop.coord) as Point);
    }

    this.drawLand();
    this.render();
  }

  /** View that fits one trip (or everything when no key) inside the free frame. */
  viewFor(key?: string): View {
    const route = key ? this.routes.get(key) : undefined;

    if (!route) {
      return { k: 1, x: 0, y: 0 };
    }

    const points = [...route.base, ...route.baseStops];

    if (points.length === 0) {
      return { k: 1, x: 0, y: 0 };
    }

    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    // Never zoom so far that a one-stop trip loses its surroundings.
    const minSize = Math.min(this.width, this.height) * 0.3;
    const boxWidth = Math.max(Math.max(...xs) - Math.min(...xs), minSize);
    const boxHeight = Math.max(Math.max(...ys) - Math.min(...ys), minSize);
    const centerX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const centerY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const freeWidth = this.width - this.frame.left - this.frame.right - this.padding * 2;
    const freeHeight = this.height - this.frame.top - this.frame.bottom - this.padding * 2;
    const k = Math.min(
      Math.max(Math.min(freeWidth / boxWidth, freeHeight / boxHeight), 1),
      MAX_ZOOM,
    );
    const frameCenterX = this.frame.left + (this.width - this.frame.left - this.frame.right) / 2;
    const frameCenterY = this.frame.top + (this.height - this.frame.top - this.frame.bottom) / 2;

    return { k, x: frameCenterX - k * centerX, y: frameCenterY - k * centerY };
  }

  /** Smooth zoom-and-pan path between two views (van Wijk), t from 0 to 1. */
  interpolator(from: View, to: View): (t: number) => View {
    const width = this.width;
    const height = this.height;
    const toCenter = (view: View): [number, number, number] => [
      (width / 2 - view.x) / view.k,
      (height / 2 - view.y) / view.k,
      width / view.k,
    ];
    const interpolate = interpolateZoom(toCenter(from), toCenter(to));

    return (t) => {
      const [centerX, centerY, span] = interpolate(t);
      const k = width / span;
      return { k, x: width / 2 - k * centerX, y: height / 2 - k * centerY };
    };
  }

  setView(view: View): void {
    this.view = view;
    this.render();
  }

  /** Draw progress of one route, 0 (hidden) to 1 (complete). */
  setProgress(key: string, progress: number): void {
    const route = this.routes.get(key);

    if (route) {
      route.progress = Math.min(Math.max(progress, 0), 1);
      this.renderProgress(route);
    }
  }

  setAllProgress(progress: number): void {
    for (const key of this.routes.keys()) {
      this.setProgress(key, progress);
    }
  }

  /** The selected route thickens and takes its chapter color. */
  select(key: string | null): void {
    for (const [routeKey, route] of this.routes) {
      route.group.classList.toggle(styles.selected, routeKey === key);
      route.group.setAttribute("aria-pressed", String(routeKey === key));
    }
  }

  /** Fade every route except one (null shows all). */
  focus(key: string | null): void {
    for (const [routeKey, route] of this.routes) {
      route.group.classList.toggle(styles.dimmed, key !== null && routeKey !== key);
      route.group.classList.toggle(styles.focused, routeKey === key);
    }
  }

  setVisible(key: string, visible: boolean): void {
    this.routes.get(key)?.group.classList.toggle(styles.hidden, !visible);
  }

  destroy(): void {
    this.svg.replaceChildren();
    this.svg.classList.remove(styles.scene);
    this.routes.clear();
  }

  private createRoute(trip: SceneTrip, index: number, parent: SVGGElement): void {
    const maskId = `${this.options.idPrefix}-route-${index}`;
    const group = svgElement(
      "g",
      { class: `${styles.route} ${trip.planned ? styles.planned : ""}`, "data-type": trip.type },
      parent,
    );
    const mask = svgElement(
      "mask",
      { id: maskId, maskUnits: "userSpaceOnUse", x: -1e5, y: -1e5, width: 2e5, height: 2e5 },
      this.defs,
    );
    const maskPath = svgElement("path", { class: styles.reveal, pathLength: 1 }, mask);
    let hit: SVGPathElement | null = null;

    if (this.options.onSelect) {
      const select = this.options.onSelect;
      hit = svgElement("path", { class: styles.hit }, group);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", trip.planned ? `${trip.label}, rencana` : trip.label);
      group.addEventListener("click", () => select(trip.key));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(trip.key);
        }
      });
    }

    const drawn = svgElement("g", { mask: `url(#${maskId})` }, group);
    const asphalt = svgElement("path", { class: styles.asphalt }, drawn);
    const center = trip.planned ? null : svgElement("path", { class: styles.center }, drawn);

    const stops = trip.stops.map((stop) => {
      const stopGroup = svgElement("g", { class: styles.stop }, group);
      svgElement("rect", { x: -4, y: -4, width: 8, height: 8 }, stopGroup);
      const label = svgElement("text", { class: styles.stopLabel, x: 9, y: -9 }, stopGroup);
      label.textContent = stop.name;

      if (this.options.interactiveStops) {
        stopGroup.setAttribute("tabindex", "0");
        stopGroup.setAttribute("role", "img");
        stopGroup.setAttribute("aria-label", stop.name);
      }

      return stopGroup;
    });

    const marker = svgElement(
      "rect",
      { class: styles.marker, x: -6, y: -6, width: 12, height: 12 },
      group,
    );

    this.routes.set(trip.key, {
      trip,
      base: [],
      baseStops: [],
      group,
      hit,
      maskPath,
      asphalt,
      center,
      marker,
      stops,
      progress: 1,
    });
  }

  private drawLand(): void {
    if (!this.land || this.width < 1) {
      return;
    }

    const path = geoPath(this.projection);
    this.coast.setAttribute("d", path(this.land.coast) ?? "");
    this.borders.setAttribute("d", path(this.land.borders) ?? "");
    this.applyLandTransform();
  }

  private applyLandTransform(): void {
    const { k, x, y } = this.view;
    this.landGroup.setAttribute("transform", `translate(${x} ${y}) scale(${k})`);
  }

  private toScreen(point: Point): Point {
    const { k, x, y } = this.view;
    return [point[0] * k + x, point[1] * k + y];
  }

  private render(): void {
    if (this.width < 1) {
      return;
    }

    this.applyLandTransform();

    for (const route of this.routes.values()) {
      const points = route.base.map((point) => this.toScreen(point));
      // A single point still gets a path so the mask and marker have something to follow.
      const d =
        points.length > 1
          ? (routeLine(points) ?? "")
          : points.length === 1
            ? `M${points[0][0]},${points[0][1]}h0.01`
            : "";

      route.asphalt.setAttribute("d", d);
      route.center?.setAttribute("d", d);
      route.maskPath.setAttribute("d", d);
      route.hit?.setAttribute("d", d);

      route.stops.forEach((stop, index) => {
        const [stopX, stopY] = this.toScreen(route.baseStops[index]);
        stop.setAttribute("transform", `translate(${stopX} ${stopY})`);
      });

      this.renderProgress(route);
    }
  }

  private renderProgress(route: RouteNodes): void {
    const { progress } = route;
    const hasPath = route.asphalt.getAttribute("d");

    route.maskPath.style.strokeDashoffset = String(1 - progress);
    route.maskPath.style.visibility = progress > 0 ? "visible" : "hidden";

    const lastStop = route.stops.length - 1;
    route.stops.forEach((stop, index) => {
      const reached = lastStop <= 0 ? progress > 0 : progress >= index / lastStop - 0.001;
      stop.style.visibility = reached ? "visible" : "hidden";
    });

    if (!hasPath || progress <= 0) {
      route.marker.style.visibility = "hidden";
      return;
    }

    const length = route.asphalt.getTotalLength();
    const point = route.asphalt.getPointAtLength(length * progress);
    route.marker.setAttribute("transform", `translate(${point.x} ${point.y})`);
    route.marker.style.visibility = "visible";
  }
}
