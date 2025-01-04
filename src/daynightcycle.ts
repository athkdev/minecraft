// @ts-nocheck

import * as THREE from "three";

export const COLORS = {
    DAWN: new THREE.Color(0xff9a76),    // Warm orange
    NOON: new THREE.Color(0xffffff),     // Bright white
    DUSK: new THREE.Color(0xff6b6b),     // Warm red
    NIGHT: new THREE.Color(0x1a237e),    // Deep blue
};

export class DayNightCycle {
    constructor(scene, directionalLight, ambientLight) {
        this.scene = scene;
        this.directionalLight = directionalLight;
        this.ambientLight = ambientLight;
        this.dayDuration = 300; // Complete day/night cycle in seconds
        this.time = 0;
        
        // Pre-create color instances for lerping
        this.currentLightColor = new THREE.Color();
        this.currentAmbientColor = new THREE.Color();
        
        // Background colors for sky
        this.bgColors = [
            { time: 0, color: new THREE.Color(0x1a237e) }, // Night
            { time: 0.25, color: new THREE.Color(0xff9a76) }, // Dawn
            { time: 0.5, color: new THREE.Color(0x87ceeb) }, // Noon
            { time: 0.75, color: new THREE.Color(0xff6b6b) }, // Dusk
            { time: 1, color: new THREE.Color(0x1a237e) }  // Night
        ];
        
        // Set up initial background color
        scene.background = new THREE.Color(this.bgColors[0].color);
    }
    
    update(deltaTime) {
        // Update time
        this.time = (this.time + deltaTime) % this.dayDuration;
        const cyclePosition = this.time / this.dayDuration;
        
        // Update sun position - simplified calculation
        const angle = cyclePosition * Math.PI * 2;
        const height = Math.sin(angle);
        
        this.directionalLight.position.set(
            300 * Math.cos(angle),
            70 + 230 * height,
            300 * Math.sin(angle)
        );
        
        // Update colors
        this.updateColors(cyclePosition, height);
    }
    
    updateColors(cyclePosition, height) {
        // Find the current and next color indices
        let i = 0;
        while (i < this.bgColors.length - 1 && this.bgColors[i + 1].time < cyclePosition) {
            i++;
        }
        
        const curr = this.bgColors[i];
        const next = this.bgColors[(i + 1) % this.bgColors.length];
        
        // Calculate blend factor
        let factor = (cyclePosition - curr.time) / (next.time - curr.time);
        if (factor < 0) factor += 1; // Handle wrap-around
        
        // Update background color
        scene.background.lerpColors(curr.color, next.color, factor);
        
        // Update light colors and intensities
        const dayIntensity = Math.max(0, height);
        this.directionalLight.intensity = THREE.MathUtils.lerp(0.1, 1, dayIntensity);
        this.ambientLight.intensity = THREE.MathUtils.lerp(0.1, 0.5, (height + 1) / 2);
        
        // Update directional light color
        if (cyclePosition < 0.25) { // Dawn to noon
            this.directionalLight.color.lerpColors(COLORS.DAWN, COLORS.NOON, cyclePosition * 4);
        } else if (cyclePosition < 0.5) { // Noon to dusk
            this.directionalLight.color.lerpColors(COLORS.NOON, COLORS.DUSK, (cyclePosition - 0.25) * 4);
        } else if (cyclePosition < 0.75) { // Dusk to night
            this.directionalLight.color.lerpColors(COLORS.DUSK, COLORS.NIGHT, (cyclePosition - 0.5) * 4);
        } else { // Night to dawn
            this.directionalLight.color.lerpColors(COLORS.NIGHT, COLORS.DAWN, (cyclePosition - 0.75) * 4);
        }
    }
}