"use client";

import { useEffect, useRef } from "react";

const clusters = [
  { x: 74, y: 22, rx: 19, ry: 18, count: 92, seed: 0.2 },
  { x: 46, y: 57, rx: 17, ry: 25, count: 82, seed: 1.4 },
  { x: 82, y: 73, rx: 13, ry: 18, count: 58, seed: 2.8 },
] as const;

type Particle = {
  clusterIndex: number;
  angle: number;
  radial: number;
  size: number;
  opacity: number;
  phase: number;
  speed: number;
  drift: number;
};

function seededValue(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const particles: Particle[] = clusters.flatMap((cluster, clusterIndex) =>
  Array.from({ length: cluster.count }, (_, index) => ({
    clusterIndex,
    angle: index * 2.3999632297 + cluster.seed,
    radial: Math.sqrt((index + 0.5) / cluster.count),
    size: 0.12 + (index % 5) * 0.035,
    opacity: 0.24 + (index % 7) * 0.075,
    phase: seededValue(index * 3.17 + cluster.seed * 11) * Math.PI * 2,
    speed: 0.24 + seededValue(index * 7.91 + cluster.seed) * 0.34,
    drift: 0.15 + seededValue(index * 5.47 + cluster.seed * 3) * 0.42,
  })),
);

export function LandingSignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) return;
    const canvas: HTMLCanvasElement = canvasNode;

    const contextNode = canvas.getContext("2d");
    if (!contextNode) return;
    const context: CanvasRenderingContext2D = contextNode;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = {
      x: 0,
      y: 0,
      easedX: 0,
      easedY: 0,
      active: false,
    };
    let width = 0;
    let height = 0;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let frame = 0;
    let startTime = performance.now();

    const toX = (value: number) => offsetX + value * scale;
    const toY = (value: number) => offsetY + value * scale;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      scale = Math.max(width / 100, height / 100);
      offsetX = (width - 100 * scale) / 2;
      offsetY = (height - 100 * scale) / 2;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function drawGuides(time: number) {
      context.lineWidth = 1;
      context.strokeStyle = "rgba(10, 37, 64, 0.065)";

      context.beginPath();
      context.moveTo(toX(12), toY(80));
      context.bezierCurveTo(
        toX(30 + Math.sin(time * 0.08) * 1.4),
        toY(63),
        toX(36),
        toY(57 + Math.cos(time * 0.07) * 1.2),
        toX(48),
        toY(55),
      );
      context.bezierCurveTo(
        toX(68),
        toY(30),
        toX(75 + Math.sin(time * 0.06) * 1.3),
        toY(23),
        toX(83),
        toY(74),
      );
      context.stroke();

      context.beginPath();
      context.ellipse(
        toX(46 + Math.sin(time * 0.07) * 0.8),
        toY(57 + Math.cos(time * 0.06) * 0.7),
        22 * scale,
        22 * scale,
        time * 0.006,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.ellipse(
        toX(75 + Math.cos(time * 0.055) * 0.7),
        toY(22 + Math.sin(time * 0.05) * 0.8),
        24 * scale,
        24 * scale,
        -time * 0.005,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    function draw(now: number) {
      const reducedMotion = motionQuery.matches;
      const elapsed = reducedMotion ? 0 : (now - startTime) / 1000;

      context.clearRect(0, 0, width, height);
      drawGuides(elapsed);

      pointer.easedX += (pointer.x - pointer.easedX) * 0.08;
      pointer.easedY += (pointer.y - pointer.easedY) * 0.08;

      for (const particle of particles) {
        const cluster = clusters[particle.clusterIndex];
        const clusterPhase = cluster.seed * 2.4;
        const centreX =
          cluster.x +
          Math.sin(elapsed * 0.11 + clusterPhase) * 1.7 +
          Math.cos(elapsed * 0.045 + clusterPhase) * 0.8;
        const centreY =
          cluster.y +
          Math.cos(elapsed * 0.095 + clusterPhase) * 1.45 +
          Math.sin(elapsed * 0.052 + clusterPhase) * 0.75;
        const breatheX = 1 + Math.sin(elapsed * 0.16 + clusterPhase) * 0.065;
        const breatheY = 1 + Math.cos(elapsed * 0.14 + clusterPhase) * 0.075;
        const rotationDirection = particle.clusterIndex % 2 === 0 ? 1 : -1;
        const angle =
          particle.angle +
          elapsed * 0.018 * rotationDirection +
          Math.sin(elapsed * particle.speed + particle.phase) * 0.045;
        const radial =
          particle.radial *
          (1 + Math.sin(elapsed * 0.2 + particle.phase) * 0.028);

        let x = toX(
          centreX +
            Math.cos(angle) * cluster.rx * radial * breatheX +
            Math.sin(elapsed * particle.speed + particle.phase) *
              particle.drift,
        );
        let y = toY(
          centreY +
            Math.sin(angle) * cluster.ry * radial * breatheY +
            Math.cos(elapsed * particle.speed * 0.83 + particle.phase) *
              particle.drift,
        );

        if (pointer.active && !reducedMotion) {
          const deltaX = x - pointer.easedX;
          const deltaY = y - pointer.easedY;
          const distance = Math.hypot(deltaX, deltaY);
          const interactionRadius = Math.min(width, 210);

          if (distance > 0 && distance < interactionRadius) {
            const force = (1 - distance / interactionRadius) ** 2;
            x += (deltaX / distance) * force * 30;
            y += (deltaY / distance) * force * 30;
          }
        }

        const pulse = reducedMotion
          ? 1
          : 0.92 +
            Math.sin(elapsed * particle.speed * 1.7 + particle.phase) * 0.12;
        context.beginPath();
        context.arc(
          x,
          y,
          Math.max(particle.size * scale * pulse, 0.8),
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(37, 99, 235, ${particle.opacity})`;
        context.fill();
      }

      if (!reducedMotion && document.visibilityState === "visible") {
        frame = window.requestAnimationFrame(draw);
      }
    }

    function restartAnimation() {
      window.cancelAnimationFrame(frame);
      startTime = performance.now();
      draw(startTime);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.active =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom &&
        event.pointerType !== "touch";

      if (pointer.active) {
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        if (pointer.easedX === 0 && pointer.easedY === 0) {
          pointer.easedX = pointer.x;
          pointer.easedY = pointer.y;
        }
      }
    }

    function handleVisibilityChange() {
      window.cancelAnimationFrame(frame);
      if (document.visibilityState === "visible") {
        startTime = performance.now();
        draw(startTime);
      }
    }

    function handleWindowBlur() {
      pointer.active = false;
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (motionQuery.matches) draw(startTime);
    });

    resize();
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", restartAnimation);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", restartAnimation);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[var(--page-bg)] via-[var(--page-bg)]/75 to-transparent" />
    </div>
  );
}
