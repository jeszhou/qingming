/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

const defaultParams = {
  fontFamily: '"Noto Serif SC", "STSong", "SimSun", serif',
  fontWeight: 400,
  fontSizeBase: 50,
  
  // Text & Scroll Parameters
  textAlphaMin: 20,
  textAlphaMax: 160,
  fontSizeMinRatio: 0.2,
  waveSpeed: 0.015,
  waveAmpY: 30,
  waveAmpX: 15,
  curveAmp: 40,
  scrollRows: 18,
  scrollCols: 35,

  // Ripple Parameters
  rippleSizeMin: 20,
  rippleSizeMax: 80,
  rippleSpeed: 1.5,
  rippleAlpha: 150,

  // Rain Parameters
  rainSpeedMin: 10,
  rainSpeedMax: 20,
  rainLengthMin: 30,
  rainLengthMax: 100,
  rainWeightMin: 0.5,
  rainWeightMax: 2,
  rainAlphaMin: 50,
  rainAlphaMax: 200,
  rainDensity: 200, // Number of raindrops on screen
  rainTilt: 0.5, // Constant tilt, no wind
  
  // Particle Parameters
  particleProb: 0.4, // 40% chance for a ripple to spawn a particle
  particleSize: 6,
  maxStars: 200, // Maximum number of permanent stars in the sky
  particleColor: '#ffd700', // Golden
  particleFloatSpeed: 0.5, // Speed at which particles float up
  
  // Star Parameters (when they reach the top)
  starSize: 1.5,
  starColor: '#ffeedd',
  starTwinkleSpeed: 0.02,
  
  // Colors
  rainColor1: '#ffffff',
  rainColor2: '#fff8dc',
  rainColor3: '#ffd700',
  rainColor4: '#ffb90f',
  rainColor5: '#ff8c00',
  bgTopColor: '#050a15',
  bgMidColor: '#0b1930',
  bgBottomColor: '#050a15',
  mountainColor: '#1a365d', // Used for ethereal waves
  textColor: '#ffd700',
  birdColor: '#ffd700',
};

export default function App() {
  const renderRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  
  const [params, setParams] = useState(defaultParams);
  const paramsRef = useRef(params);
  const [showPanel, setShowPanel] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (p5Ref.current) {
      if (isPlaying) {
        p5Ref.current.loop();
      } else {
        p5Ref.current.noLoop();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setShowPanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!renderRef.current) return;

    if (p5Ref.current) {
      p5Ref.current.remove();
      p5Ref.current = null;
    }
    renderRef.current.innerHTML = '';

    const sketch = (p: p5) => {
      let raindrops: Raindrop[] = [];
      let ripples: Ripple[] = [];
      let particles: Particle[] = [];
      let clickTimes: number[] = [];

      const scrollChars = "清明时节，雨意微凉，草木却悄悄发芽。有人离开，却没有真正走远，他们化作风，掠过肩头；化作雨，落在心上。思念不必沉重，它可以很轻，像一片新叶，在春天里慢慢展开。我们把未说完的话，托付给远山与云影，让它们带去远方。人间的相逢有时限，而心里的陪伴却可以很长很长，在岁月里静静生长。";

      p.setup = () => {
        p.createCanvas(600, 800);
        
        // Initialize raindrops based on density
        for (let i = 0; i < paramsRef.current.rainDensity; i++) {
          raindrops.push(new Raindrop(p.random(p.width), p.random(p.height), p.floor(p.random(5)), paramsRef.current));
        }
      };

      p.mousePressed = () => {
        // Only count clicks inside the canvas
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          clickTimes.push(p.millis());
        }
      };

      p.draw = () => {
        const cp = paramsRef.current;
        
        // Calculate dynamic rain density based on click speed (Clicks Per Second)
        let now = p.millis();
        clickTimes = clickTimes.filter(t => now - t < 1000); // Keep clicks from the last 1 second
        let cps = clickTimes.length;
        let dynamicDensity = cp.rainDensity + cps * 150; // Each click/sec adds 150 raindrops
        dynamicDensity = p.constrain(dynamicDensity, cp.rainDensity, 2000); // Max cap to prevent crash
        
        // Draw Gradient Background
        let gradient = p.drawingContext.createLinearGradient(0, 0, 0, p.height);
        gradient.addColorStop(0, cp.bgTopColor);
        gradient.addColorStop(0.5, cp.bgMidColor);
        gradient.addColorStop(1, cp.bgBottomColor);
        p.drawingContext.fillStyle = gradient;
        p.drawingContext.fillRect(0, 0, p.width, p.height);

        // 1. Draw Ethereal Waves (replacing Mountains)
        p.push();
        p.blendMode(p.ADD);
        p.noFill();
        let wColor = p.color(cp.mountainColor);
        
        for(let i = 0; i < 6; i++) {
            wColor.setAlpha(20 - i * 2);
            p.stroke(wColor);
            p.strokeWeight(2 + i * 1.5);
            p.beginShape();
            for(let x = -50; x <= p.width + 50; x += 20) {
                // Animate the waves slowly
                let y = 300 + i * 50 - p.noise(x * 0.002, i * 10 + p.frameCount * 0.002) * 250;
                // Add some sine wave for sweeping curves
                y += p.sin(x * 0.005 + p.frameCount * 0.01 + i) * 80;
                p.vertex(x, y);
            }
            p.endShape();
        }
        p.pop();

        // 1.5 Update and Draw Particles
        p.blendMode(p.ADD);
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update(p);
          particles[i].draw(p, cp);
        }
        
        // Cap the number of particles to prevent lag
        if (particles.length > cp.maxStars) {
          // Find the oldest star to remove
          let oldestStarIndex = particles.findIndex(part => part.isStar);
          if (oldestStarIndex !== -1) {
            particles.splice(oldestStarIndex, 1);
          } else {
            particles.shift(); // Fallback if no stars yet
          }
        }
        p.blendMode(p.BLEND);

        // 2. Draw Floating Text Scroll
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke(); // FIX: Remove inherited stroke from mountains to prevent dark outlines
        let rows = cp.scrollRows;
        let cols = cp.scrollCols;
        let tColor = p.color(cp.textColor);
        
        for (let i = 0; i < rows; i++) {
          let progress = i / (rows - 1);
          let yBase = p.map(progress * progress, 0, 1, 400, p.height + 100);
          let size = p.map(progress, 0, 1, cp.fontSizeBase * cp.fontSizeMinRatio, cp.fontSizeBase);
          let alpha = p.map(progress, 0, 1, cp.textAlphaMin, cp.textAlphaMax);
          
          tColor.setAlpha(alpha);
          p.fill(tColor);

          for (let j = 0; j < cols; j++) {
            let xProgress = j / (cols - 1);
            let xBase = p.map(xProgress, 0, 1, -150, p.width + 150);

            let time = p.frameCount * cp.waveSpeed;
            let waveY = p.sin(time + j * 0.2 + i * 0.4) * (cp.waveAmpY * progress);
            let waveX = p.cos(time + i * 0.2) * (cp.waveAmpX * progress);
            let curveY = p.sin(xProgress * p.PI) * cp.curveAmp * progress;

            let charIndex = (i * cols + j) % scrollChars.length;
            let char = scrollChars.charAt(charIndex);

            p.push();
            p.translate(xBase + waveX, yBase + waveY + curveY);
            let angle = p.cos(time + j * 0.2 + i * 0.4) * 0.2;
            p.rotate(angle);
            
            // Draw text using native canvas API to support numeric font weights
            p.drawingContext.font = `${cp.fontWeight} ${size}px ${cp.fontFamily}`;
            p.drawingContext.textAlign = 'center';
            p.drawingContext.textBaseline = 'middle';
            p.drawingContext.fillStyle = tColor.toString();
            p.drawingContext.fillText(char, 0, 0);
            
            p.pop();
          }
        }
        p.pop();

        // 2.5 Update and Draw Ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
          ripples[i].update();
          ripples[i].draw();
          if (ripples[i].dead) {
            ripples.splice(i, 1);
          }
        }

        // 3. Draw Birds
        p.push();
        p.noFill();
        let bColor = p.color(cp.birdColor);
        bColor.setAlpha(180);
        p.stroke(bColor);
        p.strokeWeight(1.5);
        let birdTime = p.frameCount * 0.03;
        for(let b = 0; b < 4; b++) {
            let bx = 350 + b * 45 + p.sin(birdTime + b) * 30;
            let by = 250 - b * 20 + p.cos(birdTime + b) * 15;
            let wingFlap = p.sin(birdTime * 4 + b) * 8;
            
            p.beginShape();
            p.vertex(bx, by);
            p.vertex(bx + 7, by - 5 + wingFlap);
            p.vertex(bx + 15, by);
            p.endShape();

            p.beginShape();
            p.vertex(bx + 15, by);
            p.vertex(bx + 23, by - 5 + wingFlap);
            p.vertex(bx + 30, by);
            p.endShape();
        }
        p.pop();

        // 4. Update and Draw Line Raindrops
        // Adjust array size based on dynamic density parameter
        while (raindrops.length < dynamicDensity) {
          raindrops.push(new Raindrop(p.random(p.width), -50, p.floor(p.random(5)), cp));
        }
        while (raindrops.length > dynamicDensity) {
          raindrops.pop();
        }

        for (let i = 0; i < raindrops.length; i++) {
          raindrops[i].update(cp.rainTilt, cp);
        }
      };

      class Raindrop {
        x: number;
        y: number;
        colorIndex: number;
        speedNorm: number;
        lengthNorm: number;
        weightNorm: number;
        alphaNorm: number;
        splashY: number;

        constructor(x: number, y: number, colorIndex: number, cp: typeof defaultParams) {
          this.x = x;
          this.y = y;
          this.colorIndex = colorIndex;
          this.speedNorm = p.random(0, 1);
          this.lengthNorm = p.random(0, 1);
          this.weightNorm = p.random(0, 1);
          this.alphaNorm = p.random(0, 1);
          
          this.splashY = p.random(400, p.height + 50);
        }

        update(rainTilt: number, cp: typeof defaultParams) {
          let speed = p.map(this.speedNorm, 0, 1, cp.rainSpeedMin, cp.rainSpeedMax);
          let length = p.map(this.lengthNorm, 0, 1, cp.rainLengthMin, cp.rainLengthMax);
          let weight = p.map(this.weightNorm, 0, 1, cp.rainWeightMin, cp.rainWeightMax);
          let alpha = p.map(this.alphaNorm, 0, 1, cp.rainAlphaMin, cp.rainAlphaMax);

          this.x += rainTilt;
          this.y += speed;

          let colors = [cp.rainColor1, cp.rainColor2, cp.rainColor3, cp.rainColor4, cp.rainColor5];
          let c = p.color(colors[this.colorIndex]);
          c.setAlpha(alpha);

          p.stroke(c);
          p.strokeWeight(weight);
          
          // Draw line from current position backwards along its path
          // Calculate the tail position based on speed and tilt to make the angle match the trajectory
          let tailX = this.x - (rainTilt / speed) * length;
          let tailY = this.y - length;
          
          p.push();
          p.blendMode(p.ADD);
          
          // Draw tail
          let tailC = p.color(colors[this.colorIndex]);
          tailC.setAlpha(alpha * 0.4);
          p.stroke(tailC);
          p.strokeWeight(weight * 0.5);
          p.line(this.x, this.y, tailX, tailY);
          
          // Draw glowing head
          p.noStroke();
          let headC = p.color(colors[this.colorIndex]);
          headC.setAlpha(alpha);
          p.fill(headC);
          p.ellipse(this.x, this.y, weight * 3, weight * 3);
          p.fill(255, 255, 255, alpha);
          p.ellipse(this.x, this.y, weight, weight);
          
          p.pop();

          // Reset if it hits splash Y
          if (this.y > this.splashY) {
            // Create ripple ALWAYS
            ripples.push(new Ripple(this.x, this.y, cp, c));
            
            // Create particle probabilistically on the water
            if (p.random() < cp.particleProb) {
              particles.push(new Particle(this.x, this.y, cp, p));
            }

            this.y = -length; 
            this.x = p.random(-100, p.width);
            this.splashY = p.random(400, p.height + 50);
            
            // Randomize properties slightly on reset for variety
            this.speedNorm = p.random(0, 1);
            this.lengthNorm = p.random(0, 1);
            this.weightNorm = p.random(0, 1);
            this.alphaNorm = p.random(0, 1);
            this.colorIndex = p.floor(p.random(5));
          } else if (this.x > p.width + length) {
            this.y = -length;
            this.x = p.random(-100, p.width);
            this.splashY = p.random(400, p.height + 50);
          }
        }
      }

      class Ripple {
        x: number;
        y: number;
        maxRadius: number;
        radius: number;
        speed: number;
        color: p5.Color;
        alpha: number;
        dead: boolean;

        constructor(x: number, y: number, cp: typeof defaultParams, c: p5.Color) {
          this.x = x;
          this.y = y;
          this.maxRadius = p.random(cp.rippleSizeMin, cp.rippleSizeMax);
          this.radius = 0;
          this.speed = cp.rippleSpeed;
          this.color = c;
          this.alpha = cp.rippleAlpha;
          this.dead = false;
        }

        update() {
          this.radius += this.speed;
          if (this.radius >= this.maxRadius) {
            this.dead = true;
          }
        }

        draw() {
          let currentAlpha = p.map(this.radius, 0, this.maxRadius, this.alpha, 0);
          this.color.setAlpha(currentAlpha);
          p.noFill();
          p.stroke(this.color);
          p.strokeWeight(1.5);
          // Draw ripple as an ellipse, but with ADD blend mode for glowing effect
          p.push();
          p.blendMode(p.ADD);
          p.ellipse(this.x, this.y, this.radius * 2, this.radius);
          p.pop();
        }
      }

      class Particle {
        x: number;
        y: number;
        maxSize: number;
        sizeMultiplier: number;
        color: p5.Color;
        floatSpeedX: number;
        floatSpeedY: number;
        seed: number;
        targetY: number;
        isStar: boolean;
        age: number;

        constructor(x: number, y: number, cp: typeof defaultParams, p: p5) {
          this.x = x;
          this.y = y;
          this.sizeMultiplier = p.random(0.2, 1.5); // Wider size variation
          this.maxSize = cp.particleSize * this.sizeMultiplier;
          this.color = p.color(cp.particleColor);
          this.floatSpeedX = p.random(-0.5, 0.5);
          this.floatSpeedY = -cp.particleFloatSpeed * p.random(0.5, 1.5); // float upwards
          this.seed = p.random(1000);
          this.targetY = p.random(10, p.height / 4); // Top 1/4 of the sky
          this.isStar = false;
          this.age = 0;
        }

        update(p: p5) {
          this.age++;
          
          if (!this.isStar) {
            // Float upwards and drift horizontally
            this.x += this.floatSpeedX + p.sin(p.frameCount * 0.02 + this.seed) * 0.5;
            this.y += this.floatSpeedY;
            
            // Stop when reaching target height
            if (this.y <= this.targetY) {
              this.isStar = true;
            }
          }
        }

        draw(p: p5, cp: typeof defaultParams) {
          p.push();
          p.noStroke();
          
          // Breathing effect (twinkle)
          let tSpeed = this.isStar ? cp.starTwinkleSpeed + (this.seed % (cp.starTwinkleSpeed * 2)) : 0.05; // Varied twinkle speed for stars
          let breath = p.map(p.sin(p.frameCount * tSpeed + this.seed), -1, 1, 0.3, 1);
          let currentBaseSize = this.isStar ? cp.starSize * this.sizeMultiplier : this.maxSize;
          let currentSize = currentBaseSize * breath;
          
          // Fade in when born
          let alpha = p.min(this.age * 5, 255);
          let drawColor = this.isStar ? p.color(cp.starColor) : this.color;
          
          p.translate(this.x, this.y);
          
          if (!this.isStar) {
            p.rotate(p.frameCount * 0.01 + this.seed); // Slow rotation while floating
            
            // Glow effect (draw multiple concentric layers)
            for (let layer = 3; layer > 0; layer--) {
              drawColor.setAlpha(alpha / (layer * 2));
              p.fill(drawColor);
              
              let layerSize = currentSize * layer;
              
              // Draw 4-point star (sparkle)
              p.ellipse(0, 0, layerSize * 2, layerSize * 0.3);
              p.ellipse(0, 0, layerSize * 0.3, layerSize * 2);
              
              // Center glow
              p.ellipse(0, 0, layerSize * 0.8, layerSize * 0.8);
            }
            
            // Core sparkle
            drawColor.setAlpha(alpha);
            p.fill(drawColor);
            p.ellipse(0, 0, currentSize * 2, currentSize * 0.3);
            p.ellipse(0, 0, currentSize * 0.3, currentSize * 2);
            
            // Bright center dot
            p.fill(255, 255, 255, alpha * 0.8);
            p.ellipse(0, 0, currentSize * 0.8, currentSize * 0.8);
          } else {
            // It's a star in the sky - draw as a hazy starburst
            // We don't rotate here so the starburst flares are axis-aligned (like a lens flare)
            
            // Cross-shaped glow (hazy) instead of circular
            for (let layer = 3; layer > 0; layer--) {
              drawColor.setAlpha(alpha / (layer * 2.5));
              p.fill(drawColor);
              
              let layerSize = currentSize * layer * 1.5;
              p.ellipse(0, 0, layerSize * 2, layerSize * 0.3);
              p.ellipse(0, 0, layerSize * 0.3, layerSize * 2);
              p.ellipse(0, 0, layerSize * 0.8, layerSize * 0.8);
            }
            
            // Starburst cross (horizontal and vertical flares)
            drawColor.setAlpha(alpha * 0.6);
            p.fill(drawColor);
            p.ellipse(0, 0, currentSize * 5, currentSize * 0.3); // Horizontal
            p.ellipse(0, 0, currentSize * 0.3, currentSize * 5); // Vertical
            
            // Core dot
            drawColor.setAlpha(alpha);
            p.fill(drawColor);
            p.ellipse(0, 0, currentSize * 1.5, currentSize * 1.5);
            
            // Bright center
            p.fill(255, 255, 255, alpha);
            p.ellipse(0, 0, currentSize * 0.6, currentSize * 0.6);
          }
          
          p.pop();
        }
      }
    };

    p5Ref.current = new p5(sketch, renderRef.current);

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
      if (renderRef.current) {
        renderRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center relative overflow-hidden font-sans">
      <div ref={renderRef} className="shadow-2xl" />
      
      {showPanel && (
        <div className="absolute top-4 right-4 bg-white/90 p-5 rounded-xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto backdrop-blur-md border border-gray-200 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">控制面板</h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">按 H 隐藏</span>
          </div>
          
          <div className="space-y-6">
            {/* Font & Scroll Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-green-600 rounded-full"></span>
                画卷与字体参数
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">字体名称 (Font Family)</label>
                  <input 
                    type="text" 
                    value={params.fontFamily}
                    onChange={e => setParams({...params, fontFamily: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>字粗细 (Weight)</span>
                      <span className="font-mono">{params.fontWeight}</span>
                    </label>
                    <input 
                      type="range" min="100" max="900" step="100"
                      value={params.fontWeight}
                      onChange={e => setParams({...params, fontWeight: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>基础大小</span>
                      <span className="font-mono">{params.fontSizeBase}</span>
                    </label>
                    <input 
                      type="range" min="10" max="100" 
                      value={params.fontSizeBase}
                      onChange={e => setParams({...params, fontSizeBase: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>远端比例</span>
                      <span className="font-mono">{params.fontSizeMinRatio}</span>
                    </label>
                    <input 
                      type="range" min="0.05" max="1" step="0.05"
                      value={params.fontSizeMinRatio}
                      onChange={e => setParams({...params, fontSizeMinRatio: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小透明度</span>
                      <span className="font-mono">{params.textAlphaMin}</span>
                    </label>
                    <input 
                      type="range" min="0" max="255" 
                      value={params.textAlphaMin}
                      onChange={e => setParams({...params, textAlphaMin: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大透明度</span>
                      <span className="font-mono">{params.textAlphaMax}</span>
                    </label>
                    <input 
                      type="range" min="0" max="255" 
                      value={params.textAlphaMax}
                      onChange={e => setParams({...params, textAlphaMax: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>漂动速度</span>
                      <span className="font-mono">{params.waveSpeed}</span>
                    </label>
                    <input 
                      type="range" min="0.001" max="0.05" step="0.001"
                      value={params.waveSpeed}
                      onChange={e => setParams({...params, waveSpeed: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>整体弯曲度</span>
                      <span className="font-mono">{params.curveAmp}</span>
                    </label>
                    <input 
                      type="range" min="0" max="100" 
                      value={params.curveAmp}
                      onChange={e => setParams({...params, curveAmp: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>纵向起伏</span>
                      <span className="font-mono">{params.waveAmpY}</span>
                    </label>
                    <input 
                      type="range" min="0" max="100" 
                      value={params.waveAmpY}
                      onChange={e => setParams({...params, waveAmpY: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>横向摇摆</span>
                      <span className="font-mono">{params.waveAmpX}</span>
                    </label>
                    <input 
                      type="range" min="0" max="100" 
                      value={params.waveAmpX}
                      onChange={e => setParams({...params, waveAmpX: Number(e.target.value)})}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Particle Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-yellow-400 rounded-full"></span>
                璀璨星尘参数
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">星尘颜色</label>
                  <input type="color" value={params.particleColor} onChange={e => setParams({...params, particleColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>生成概率</span>
                    <span className="font-mono">{(params.particleProb * 100).toFixed(0)}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={params.particleProb}
                    onChange={e => setParams({...params, particleProb: Number(e.target.value)})}
                    className="w-full accent-yellow-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>星尘大小</span>
                      <span className="font-mono">{params.particleSize}px</span>
                    </label>
                    <input 
                      type="range" min="1" max="20" 
                      value={params.particleSize}
                      onChange={e => setParams({...params, particleSize: Number(e.target.value)})}
                      className="w-full accent-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>漂浮速度</span>
                      <span className="font-mono">{params.particleFloatSpeed}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="5" step="0.1"
                      value={params.particleFloatSpeed}
                      onChange={e => setParams({...params, particleFloatSpeed: Number(e.target.value)})}
                      className="w-full accent-yellow-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>最大星辰数</span>
                    <span className="font-mono">{params.maxStars}</span>
                  </label>
                  <input 
                    type="range" min="50" max="1000" step="10"
                    value={params.maxStars}
                    onChange={e => setParams({...params, maxStars: Number(e.target.value)})}
                    className="w-full accent-yellow-400"
                  />
                </div>
              </div>
            </div>

            {/* Star Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                天空星辰参数 (定格后)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">星辰颜色</label>
                  <input type="color" value={params.starColor} onChange={e => setParams({...params, starColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>星辰大小</span>
                      <span className="font-mono">{params.starSize}px</span>
                    </label>
                    <input 
                      type="range" min="1" max="10" step="0.5"
                      value={params.starSize}
                      onChange={e => setParams({...params, starSize: Number(e.target.value)})}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>闪烁频率</span>
                      <span className="font-mono">{params.starTwinkleSpeed}</span>
                    </label>
                    <input 
                      type="range" min="0.005" max="0.1" step="0.005"
                      value={params.starTwinkleSpeed}
                      onChange={e => setParams({...params, starTwinkleSpeed: Number(e.target.value)})}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ripple Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                涟漪参数
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小大小</span>
                      <span className="font-mono">{params.rippleSizeMin}px</span>
                    </label>
                    <input 
                      type="range" min="5" max="50" 
                      value={params.rippleSizeMin}
                      onChange={e => setParams({...params, rippleSizeMin: Number(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大大小</span>
                      <span className="font-mono">{params.rippleSizeMax}px</span>
                    </label>
                    <input 
                      type="range" min="20" max="150" 
                      value={params.rippleSizeMax}
                      onChange={e => setParams({...params, rippleSizeMax: Number(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>扩散速度</span>
                      <span className="font-mono">{params.rippleSpeed}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="5" step="0.1"
                      value={params.rippleSpeed}
                      onChange={e => setParams({...params, rippleSpeed: Number(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>初始透明度</span>
                      <span className="font-mono">{params.rippleAlpha}</span>
                    </label>
                    <input 
                      type="range" min="10" max="255" 
                      value={params.rippleAlpha}
                      onChange={e => setParams({...params, rippleAlpha: Number(e.target.value)})}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rain Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                线状雨滴参数
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>同屏密度 (数量)</span>
                    <span className="font-mono">{params.rainDensity}</span>
                  </label>
                  <input 
                    type="range" min="10" max="500" step="10"
                    value={params.rainDensity}
                    onChange={e => setParams({...params, rainDensity: Number(e.target.value)})}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>倾斜度</span>
                    <span className="font-mono">{params.rainTilt}</span>
                  </label>
                  <input 
                    type="range" min="-5" max="5" step="0.1"
                    value={params.rainTilt}
                    onChange={e => setParams({...params, rainTilt: Number(e.target.value)})}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小速度</span>
                      <span className="font-mono">{params.rainSpeedMin}</span>
                    </label>
                    <input 
                      type="range" min="1" max="30" step="1"
                      value={params.rainSpeedMin}
                      onChange={e => setParams({...params, rainSpeedMin: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大速度</span>
                      <span className="font-mono">{params.rainSpeedMax}</span>
                    </label>
                    <input 
                      type="range" min="5" max="50" step="1"
                      value={params.rainSpeedMax}
                      onChange={e => setParams({...params, rainSpeedMax: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小长度</span>
                      <span className="font-mono">{params.rainLengthMin}px</span>
                    </label>
                    <input 
                      type="range" min="5" max="50" 
                      value={params.rainLengthMin}
                      onChange={e => setParams({...params, rainLengthMin: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大长度</span>
                      <span className="font-mono">{params.rainLengthMax}px</span>
                    </label>
                    <input 
                      type="range" min="10" max="150" 
                      value={params.rainLengthMax}
                      onChange={e => setParams({...params, rainLengthMax: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小粗细</span>
                      <span className="font-mono">{params.rainWeightMin}px</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="5" step="0.5"
                      value={params.rainWeightMin}
                      onChange={e => setParams({...params, rainWeightMin: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大粗细</span>
                      <span className="font-mono">{params.rainWeightMax}px</span>
                    </label>
                    <input 
                      type="range" min="1" max="10" step="0.5"
                      value={params.rainWeightMax}
                      onChange={e => setParams({...params, rainWeightMax: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最小透明度</span>
                      <span className="font-mono">{params.rainAlphaMin}</span>
                    </label>
                    <input 
                      type="range" min="10" max="255" 
                      value={params.rainAlphaMin}
                      onChange={e => setParams({...params, rainAlphaMin: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>最大透明度</span>
                      <span className="font-mono">{params.rainAlphaMax}</span>
                    </label>
                    <input 
                      type="range" min="10" max="255" 
                      value={params.rainAlphaMax}
                      onChange={e => setParams({...params, rainAlphaMax: Number(e.target.value)})}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color Parameters */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                颜色参数
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">天空色 (上段)</label>
                  <input type="color" value={params.bgTopColor} onChange={e => setParams({...params, bgTopColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">远山色 (中段)</label>
                  <input type="color" value={params.bgMidColor} onChange={e => setParams({...params, bgMidColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">水面色 (下段)</label>
                  <input type="color" value={params.bgBottomColor} onChange={e => setParams({...params, bgBottomColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">星云色 (原山脉)</label>
                  <input type="color" value={params.mountainColor} onChange={e => setParams({...params, mountainColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">文字色</label>
                  <input type="color" value={params.textColor} onChange={e => setParams({...params, textColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-600 font-medium">飞鸟色</label>
                  <input type="color" value={params.birdColor} onChange={e => setParams({...params, birdColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs text-gray-600 font-medium mb-2">雨滴色板 (5色随机)</label>
                  <div className="flex gap-2 justify-between">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer" value={params.rainColor1} onChange={e => setParams({...params, rainColor1: e.target.value})} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer" value={params.rainColor2} onChange={e => setParams({...params, rainColor2: e.target.value})} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer" value={params.rainColor3} onChange={e => setParams({...params, rainColor3: e.target.value})} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer" value={params.rainColor4} onChange={e => setParams({...params, rainColor4: e.target.value})} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer" value={params.rainColor5} onChange={e => setParams({...params, rainColor5: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${isPlaying ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {isPlaying ? 'Pause (暂停)' : 'Start (开始)'}
              </button>
              <button 
                onClick={() => setParams(defaultParams)} 
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
              >
                Reset (重置)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
