"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/motion/gsap";
import type { TripSummary } from "@/lib/types";
import styles from "./Ledger.module.css";

const VERTEX = /* glsl */ `
  uniform vec2 uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // The plane bends against its direction of travel, most in the middle.
    p.x -= uVelocity.x * sin(uv.y * 3.14159) * 0.0045;
    p.y += uVelocity.y * sin(uv.x * 3.14159) * 0.0045;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uVelocity;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float strength = min(length(uVelocity) * 0.0006, 0.02);
    vec2 uv = vUv + vec2(
      sin(vUv.y * 14.0 + uTime * 3.0),
      cos(vUv.x * 14.0 + uTime * 3.0)
    ) * strength;
    vec4 color = texture2D(uTexture, clamp(uv, 0.0, 1.0));
    gl_FragColor = vec4(color.rgb, color.a * uOpacity);
  }
`;

/** Same-origin URL of the 800px variant (WebGL textures need CORS-clean images). */
function textureUrl(trip: TripSummary): string | null {
  if (!trip.cover) {
    return null;
  }

  const candidates = trip.cover.srcset.split(",").map((entry) => entry.trim().split(/\s+/));
  const pick = candidates.find(([, width]) => width === "800w") ?? candidates[0];
  const url = new URL(pick?.[0] ?? trip.cover.src);
  const marker = "/storage/";
  const index = url.pathname.indexOf(marker);

  return index === -1 ? null : `/media/${url.pathname.slice(index + marker.length)}`;
}

/**
 * Cursor-following cover preview for the ledger: one shared canvas, one plane, the texture
 * swapped per row, a small displacement shader driven by cursor velocity. `three` is
 * imported only when this mounts (desktop with hover, not low-end, motion allowed).
 */
export function LedgerPreview({
  list,
  trips,
}: {
  list: RefObject<HTMLOListElement | null>;
  trips: TripSummary[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const rows = list.current;

    if (!element || !rows) {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) {
        return;
      }

      const renderer = new THREE.WebGLRenderer({ canvas: element, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
      const geometry = new THREE.PlaneGeometry(1, 1, 24, 24);
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        uniforms: {
          uTexture: { value: null },
          uVelocity: { value: new THREE.Vector2() },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
      });
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      const loader = new THREE.TextureLoader();
      const textures = new Map<string, InstanceType<typeof THREE.Texture>>();
      const aspects = new Map(
        trips.map((trip) => [trip.slug, trip.cover ? trip.cover.width / trip.cover.height : 1.5]),
      );
      const urls = new Map(trips.map((trip) => [trip.slug, textureUrl(trip)]));

      const pointer = { x: 0, y: 0 };
      const position = { x: 0, y: 0 };
      const velocity = new THREE.Vector2();
      const state = { opacity: 0, scale: 0.88 };
      let width = 0;
      let height = 0;
      let frame = 0;
      let active: string | null = null;

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.left = 0;
        camera.right = width;
        camera.top = 0;
        camera.bottom = -height;
        camera.updateProjectionMatrix();
      };

      const render = () => {
        frame = 0;
        const previousX = position.x;
        const previousY = position.y;
        position.x += (pointer.x - position.x) * 0.16;
        position.y += (pointer.y - position.y) * 0.16;
        velocity.set(
          velocity.x * 0.8 + (position.x - previousX) * 0.2 * 8,
          velocity.y * 0.8 + (position.y - previousY) * 0.2 * 8,
        );
        velocity.clampLength(0, 40);

        const previewWidth = Math.min(Math.max(width * 0.24, 240), 420);
        const previewHeight = previewWidth / (aspects.get(active ?? "") ?? 1.5);
        plane.scale.set(previewWidth * state.scale, previewHeight * state.scale, 1);
        plane.position.set(position.x + previewWidth * 0.25, -position.y, 0);
        material.uniforms.uVelocity.value.copy(velocity);
        material.uniforms.uOpacity.value = state.opacity;
        material.uniforms.uTime.value = performance.now() / 1000;
        renderer.render(scene, camera);

        // Keep rendering while the preview is visible or still settling.
        if (state.opacity > 0.001 || velocity.lengthSq() > 0.01) {
          frame = requestAnimationFrame(render);
        }
      };

      const wake = () => {
        if (frame === 0) {
          frame = requestAnimationFrame(render);
        }
      };

      const show = (slug: string) => {
        const url = urls.get(slug);

        if (!url) {
          hide();
          return;
        }

        active = slug;
        let texture = textures.get(slug);

        if (!texture) {
          texture = loader.load(url, wake);
          texture.minFilter = THREE.LinearFilter;
          textures.set(slug, texture);
        }

        material.uniforms.uTexture.value = texture;
        gsap.to(state, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out", onUpdate: wake });
      };

      const hide = () => {
        active = null;
        gsap.to(state, {
          opacity: 0,
          scale: 0.88,
          duration: 0.35,
          ease: "power3.out",
          onUpdate: wake,
        });
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") {
          return;
        }

        pointer.x = event.clientX;
        pointer.y = event.clientY;

        if (state.opacity === 0 && active === null) {
          position.x = pointer.x;
          position.y = pointer.y;
        }

        const row = (event.target as Element).closest<HTMLElement>("[data-slug]");

        if (row && row.dataset.slug !== active) {
          show(row.dataset.slug as string);
        }

        wake();
      };

      const onLeave = () => hide();

      resize();
      window.addEventListener("resize", resize);
      rows.addEventListener("pointermove", onMove);
      rows.addEventListener("pointerleave", onLeave);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        rows.removeEventListener("pointermove", onMove);
        rows.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(state);
        textures.forEach((texture) => texture.dispose());
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [list, trips]);

  return <canvas ref={canvas} className={styles.preview} aria-hidden="true" />;
}
