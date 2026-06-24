import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type EngineOptions = {
    root: HTMLElement;
    scenes: HTMLElement[];
    imageLayers: HTMLElement[];
    backgroundLayer: HTMLElement;
    productLayer: HTMLElement;
    textLayer: HTMLElement;
    nextSection?: HTMLElement | null;
    isMobile?: boolean;
};

function createSceneTimeline(sceneIn: HTMLElement, sceneOut: HTMLElement, imageIn: HTMLElement, imageOut: HTMLElement) {
    const tl = gsap.timeline();

    tl.to(sceneOut, {
        autoAlpha: 0,
        y: -20,
        duration: 0.45,
        ease: "power2.out",
    })
        .to(
            imageOut,
            {
                autoAlpha: 0,
                scale: 1.05,
                duration: 0.5,
                ease: "power2.out",
            },
            "<",
        )
        .fromTo(
            sceneIn,
            { autoAlpha: 0, y: 18 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                ease: "power2.out",
            },
            "<0.12",
        )
        .fromTo(
            imageIn,
            { autoAlpha: 0, scale: 0.95 },
            {
                autoAlpha: 1,
                scale: 1,
                duration: 0.7,
                ease: "power2.out",
            },
            "<",
        );

    return tl;
}

export function createDesktopScrollEngine({
    root,
    scenes,
    imageLayers,
    backgroundLayer,
    productLayer,
    textLayer,
    nextSection,
    isMobile = false,
}: EngineOptions) {
    gsap.set(scenes, { autoAlpha: 0, y: 18, force3D: true });
    gsap.set(imageLayers, { autoAlpha: 0, scale: 0.95, force3D: true });
    gsap.set(scenes[0], { autoAlpha: 1, y: 0 });
    gsap.set(imageLayers[0], { autoAlpha: 1, scale: 1 });

    if (nextSection) {
        gsap.set(nextSection, { autoAlpha: 0.35, y: 24 });
    }

    const master = gsap.timeline({
        scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=260%",
            scrub: 0.8,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
        },
    });

    // 1. Add scene transitions first to determine total duration
    for (let i = 1; i < scenes.length; i++) {
        master.add(createSceneTimeline(scenes[i], scenes[i - 1], imageLayers[i], imageLayers[i - 1]), ">-0.08");
    }

    master.to({}, { duration: 0.35 });

    // 2. Query total duration of transitions
    const totalDuration = master.duration();

    // 3. Add smooth parallax layers mapped over the full timeline duration
    const parallaxBgY = isMobile ? 0 : -4;
    const parallaxProductY = isMobile ? 0 : -2;
    const parallaxTextY = isMobile ? 0 : -3;

    master.to(
        backgroundLayer,
        {
            yPercent: parallaxBgY,
            ease: "none",
            duration: totalDuration,
        },
        0,
    );

    master.to(
        productLayer,
        {
            yPercent: parallaxProductY,
            ease: "none",
            duration: totalDuration,
        },
        0,
    );

    master.to(
        textLayer,
        {
            yPercent: parallaxTextY,
            ease: "none",
            duration: totalDuration,
        },
        0,
    );

    if (nextSection) {
        gsap.timeline({
            scrollTrigger: {
                trigger: root,
                start: "bottom bottom",
                end: "+=40%",
                scrub: true,
            },
        }).to(nextSection, {
            autoAlpha: 1,
            y: 0,
            ease: "none",
        });
    }

    return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
            if (trigger.trigger === root) {
                trigger.kill();
            }
        });
    };
}
