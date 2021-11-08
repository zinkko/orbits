let setConfig;
let startAnimation;
let createOrbit;

(function () {
    const TAU = 2 * Math.PI;
    const epsilon = 0.0001;
    let K = 40000;
    let starSize = 16;
    let planetSize = 4;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    setConfig = (newConfig) => {
        if (newConfig.K) K = newConfig.K;
        if (newConfig.planetSize) planetSize = newConfig.planetSize;
        if (newConfig.starSize) starSize = newConfig.starSize;
    }

    /**
     * Calculate ellipse parameters for the orbit. Orbit is centered around the main body at the center of the screen
     * 
     * @param a semi-major axis
     * @param e eccentricity
     * @param tilt tilt of the orbit center line
     */
    createOrbit = (a, e, tilt) => {
        const fx = W/2;
        const fy = H/2;
        
        const c = e*a;
        const factor = Math.sqrt((1+e) / (1-e));
        return {
            a,
            b: Math.sqrt(a*a - c*c),
            c,
            e,
            fx,
            fy,
            cx: fx - c * Math.cos(tilt),
            cy: fy - c * Math.sin(tilt),
            tilt,
            t: a * Math.sqrt(a/K),
            getR: (theta) => {
                const numerator = 1 - e*e;
                const denominator = 1 + e*Math.cos(theta);
                return a * numerator / denominator;
            },
            calculateEccentricAnomaly: (M) => {
                let estimate = M;
                for (let i=0; i<10; i++) {
                    let old = estimate;
                    estimate = estimate - (M + e * Math.sin(estimate) - estimate) / (e * Math.cos(estimate) - 1);
                    if (Math.abs(estimate - old) < epsilon) {
                        break;
                    }
                }
                return estimate % TAU;
            },
            calculateTrueAnomaly: (E) => {
                return 2 * Math.atan(factor * Math.tan(E/2));
                // const y = Math.sqrt(1 - e*e) * Math.sin(E);
                // const x = Math.cos(E) - e;
                // return Math.atan2(y, x);
            },
        }
    }

    const draw = (dt, orbits) => {
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = 'darkorange';
        ctx.arc(W/2, H/2, starSize, 0, TAU);
        ctx.fill();
        ctx.closePath();
        
        orbits.forEach((orbit) => drawOrbit(dt, orbit));
    }

    const drawOrbit = (dt, orbit) => {
        const M = TAU * (dt % orbit.t) / orbit.t;
        const E = orbit.calculateEccentricAnomaly(M);
        const nu = orbit.calculateTrueAnomaly(E);
        
        ctx.beginPath();
        ctx.ellipse(orbit.cx, orbit.cy, orbit.a, orbit.b, orbit.tilt, 0, TAU);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.fillStyle = 'black';
        const r = orbit.getR(nu);
        ctx.arc(orbit.fx + r * Math.cos(orbit.tilt + nu), orbit.fy + r * Math.sin(orbit.tilt + nu), planetSize, 0, TAU);
        ctx.fill();
        ctx.closePath();
    }

    let t0 = performance.now();
    startAnimation = (orbits) => {
        const step = () => {
            // seconds since start
            const dt = (performance.now() - t0) / 1000;
            draw(dt, orbits);
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
})();