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
  rainDensity: 0, 
  rainTilt: 0.5,
  
  // Particle & Star Parameters
  particleProb: 0.4,
  particleSize: 6,
  maxStars: 300,
  particleColor: '#ffd700',
  particleFloatSpeed: 0.5,
  starSize: 1.5,
  starColor: '#ffeedd',
  starTwinkleSpeed: 0.02,
  starGlow: 4,        // 控制面板新参数：朦胧感
  starBrightness: 1.0, // 控制面板新参数：明亮度
  
  // Colors
  rainColor1: '#ffffff',
  rainColor2: '#fff8dc',
  rainColor3: '#ffd700',
  rainColor4: '#ffb90f',
  rainColor5: '#ff8c00',
  bgTopColor: '#050a15',
  bgMidColor: '#0b1930',
  bgBottomColor: '#050a15',
  mountainColor: '#1a365d',
  textColor: '#ffd700',
  birdColor: '#ffd700',
};

export default function App() {
  const renderRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  
  const [params, setParams] = useState(() => {
    const saved = localStorage.getItem('qingming_params');
    return saved ? JSON.parse(saved) : defaultParams;
  });
  const paramsRef = useRef(params);
  const [showPanel, setShowPanel] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const resetTrigger = useRef(false);

  useEffect(() => {
    localStorage.setItem('qingming_params', JSON.stringify(params));
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (p5Ref.current) {
      isPlaying ? p5Ref.current.loop() : p5Ref.current.noLoop();
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') setShowPanel(prev => !prev);
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

    const sketch = (p: p5) => {
      let raindrops: Raindrop[] = [];
      let ripples: Ripple[] = [];
      let particles: Particle[] = [];
      let clickTimes: number[] = [];
      let currentRainAmount = 0; 

      const scrollChars = "清明时节，雨意微凉，草木却悄悄发芽。有人离开，却没有真正走远，他们化作风，掠过肩头；化作雨，落在心上。思念不必沉重，它可以很轻，像一片新叶，在春天里慢慢展开。我们把未说完的话，托付给远山与云影，让它们带去远方。人间的相逢有时限，而心里的陪伴却可以很长很长，在岁月里静静生长。";

      p.setup = () => { p.createCanvas(600, 800); };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          clickTimes.push(p.millis());
        }
      };

      p.draw = () => {
        const cp = paramsRef.current;
        if (resetTrigger.current) {
          particles = [];
          clickTimes = [];
          currentRainAmount = 0;
          resetTrigger.current = false;
        }

        let now = p.millis();
        clickTimes = clickTimes.filter(t => now - t < 1500); 
        let cps = clickTimes.length;
        let targetDensity = cp.rainDensity + (cps * 120); 
        currentRainAmount = p.lerp(currentRainAmount, targetDensity, 0.05);
        let finalDensity = p.constrain(currentRainAmount, 0, 2000);
        
        let gradient = p.drawingContext.createLinearGradient(0, 0, 0, p.height);
        gradient.addColorStop(0, cp.bgTopColor);
        gradient.addColorStop(0.5, cp.bgMidColor);
        gradient.addColorStop(1, cp.bgBottomColor);
        p.drawingContext.fillStyle = gradient;
        p.drawingContext.fillRect(0, 0, p.width, p.height);

        // 优化后的波浪过渡
        p.push();
        p.blendMode(p.ADD);
        p.noFill();
        let wColor = p.color(cp.mountainColor);
        for(let i = 0; i < 8; i++) {
            wColor.setAlpha(12 - i);
            p.stroke(wColor);
            p.strokeWeight(2 + i * 1.2);
            p.beginShape();
            for(let x = -50; x <= p.width + 50; x += 30) {
                let yOffset = p.noise(x * 0.001, i * 50 + p.frameCount * 0.002, p.frameCount * 0.001 * (i+1)) * 280;
                let yBase = 320 + i * 45 - yOffset;
                yBase += p.sin(x * (0.004 + p.noise(i) * 0.002) + p.frameCount * 0.01 + i) * 70;
                p.vertex(x, yBase);
            }
            p.endShape();
        }
        p.pop();

        // 渲染星辰/星尘 (带朦胧感和过渡)
        p.blendMode(p.ADD);
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update(p);
          particles[i].draw(p, cp);
        }
        p.blendMode(p.BLEND);

        // 渲染文字
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
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
            p.rotate(p.cos(time + j * 0.2 + i * 0.4) * 0.2);
            p.drawingContext.font = `${cp.fontWeight} ${size}px ${cp.fontFamily}`;
            p.drawingContext.textAlign = 'center'; p.drawingContext.textBaseline = 'middle';
            p.drawingContext.fillStyle = tColor.toString();
            p.drawingContext.fillText(char, 0, 0);
            p.pop();
          }
        }
        p.pop();

        // 渲染涟漪
        for (let i = ripples.length - 1; i >= 0; i--) {
          ripples[i].update(); ripples[i].draw();
          if (ripples[i].dead) ripples.splice(i, 1);
        }

        // 飞鸟渲染 (已优化融入感)
        // p.push();
        // p.noFill();
        // let bColor = p.color(cp.birdColor);
        // bColor.setAlpha(180);
        // p.stroke(bColor);
        // p.strokeWeight(1.5);
        // if (cp.starGlow > 0) (p.drawingContext as any).filter = `blur(${cp.starGlow * 0.5}px)`; // 飞鸟也带一点微弱朦胧感
        // let birdTime = p.frameCount * 0.03;
        // for(let b = 0; b < 4; b++) {
        //     let bx = 350 + b * 45 + p.sin(birdTime + b) * 30; 
        //     let by = 250 - b * 20 + p.cos(birdTime + b) * 15; 
        //     let wingFlap = p.sin(birdTime * 4 + b) * 8;
        //     p.beginShape(); p.vertex(bx, by); p.vertex(bx + 7, by - 5 + wingFlap); p.vertex(bx + 15, by); p.endShape();
        //     p.beginShape(); p.vertex(bx + 15, by); p.vertex(bx + 23, by - 5 + wingFlap); p.vertex(bx + 30, by); p.endShape();
        // }
        // (p.drawingContext as any).filter = 'none';
        // p.pop();

        // 雨滴池管理
        while (raindrops.length < finalDensity) raindrops.push(new Raindrop(p.random(p.width), -50, p.floor(p.random(5)), cp));
        while (raindrops.length > finalDensity) raindrops.pop();
        for (let i = 0; i < raindrops.length; i++) raindrops[i].update(cp.rainTilt, cp);
      };

      class Raindrop {
        x: number; y: number; colorIndex: number; speedNorm: number; lengthNorm: number; weightNorm: number; alphaNorm: number; splashY: number;
        constructor(x: number, y: number, colorIndex: number, cp: any) {
          this.x = x; this.y = y; this.colorIndex = colorIndex; this.speedNorm = p.random(0, 1); this.lengthNorm = p.random(0, 1); this.weightNorm = p.random(0, 1); this.alphaNorm = p.random(0, 1); this.splashY = p.random(400, p.height + 50);
        }
        update(rainTilt: number, cp: any) {
          let speed = p.map(this.speedNorm, 0, 1, cp.rainSpeedMin, cp.rainSpeedMax);
          let length = p.map(this.lengthNorm, 0, 1, cp.rainLengthMin, cp.rainLengthMax);
          let weight = p.map(this.weightNorm, 0, 1, cp.rainWeightMin, cp.rainWeightMax);
          let alpha = p.map(this.alphaNorm, 0, 1, cp.rainAlphaMin, cp.rainAlphaMax);
          this.x += rainTilt; this.y += speed;
          let colors = [cp.rainColor1, cp.rainColor2, cp.rainColor3, cp.rainColor4, cp.rainColor5];
          let c = p.color(colors[this.colorIndex]); c.setAlpha(alpha);
          p.stroke(c); p.strokeWeight(weight);
          let tailX = this.x - (rainTilt / speed) * length; let tailY = this.y - length;
          p.push(); p.blendMode(p.ADD);
          let tailC = p.color(colors[this.colorIndex]); tailC.setAlpha(alpha * 0.4);
          p.stroke(tailC); p.strokeWeight(weight * 0.5); p.line(this.x, this.y, tailX, tailY);
          p.noStroke(); let headC = p.color(colors[this.colorIndex]); headC.setAlpha(alpha); p.fill(headC);
          p.ellipse(this.x, this.y, weight * 3, weight * 3); p.fill(255, 255, 255, alpha); p.ellipse(this.x, this.y, weight, weight);
          p.pop();
          if (this.y > this.splashY) {
            ripples.push(new Ripple(this.x, this.y, cp, c));
            if (p.random() < cp.particleProb) particles.push(new Particle(this.x, this.y, cp, p));
            this.y = -length; this.x = p.random(-100, p.width); this.splashY = p.random(400, p.height + 50);
          }
        }
      }

      class Ripple {
        x: number; y: number; maxRadius: number; radius: number; speed: number; color: p5.Color; alpha: number; dead: boolean;
        constructor(x: number, y: number, cp: any, c: p5.Color) {
          this.x = x; this.y = y; this.maxRadius = p.random(cp.rippleSizeMin, cp.rippleSizeMax); this.radius = 0; this.speed = cp.rippleSpeed; this.color = c; this.alpha = cp.rippleAlpha; this.dead = false;
        }
        update() { this.radius += this.speed; if (this.radius >= this.maxRadius) this.dead = true; }
        draw() {
          let currentAlpha = p.map(this.radius, 0, this.maxRadius, this.alpha, 0);
          this.color.setAlpha(currentAlpha); p.noFill(); p.stroke(this.color); p.strokeWeight(1.5);
          p.push(); p.blendMode(p.ADD); p.ellipse(this.x, this.y, this.radius * 2, this.radius); p.pop();
        }
      }

      class Particle {
        x: number; y: number; sizeMultiplier: number; maxSize: number; color: p5.Color; floatSpeedX: number; floatSpeedY: number; seed: number; targetY: number; isStar: boolean; age: number; individualBrightness: number;
        constructor(x: number, y: number, cp: any, p: p5) {
          this.x = x; this.y = y; this.sizeMultiplier = p.random(0.2, 1.5); this.maxSize = cp.particleSize * this.sizeMultiplier; this.color = p.color(cp.particleColor); this.floatSpeedX = p.random(-0.5, 0.5); this.floatSpeedY = -cp.particleFloatSpeed * p.random(0.5, 1.5); this.seed = p.random(1000);
          let limit = p.height / 3; this.targetY = p.random(10, limit + 20); this.isStar = false; this.age = 0; this.individualBrightness = p.random(0.5, 1.5);
        }
        update(p: p5) {
          this.age++;
          if (!this.isStar) {
            this.x += this.floatSpeedX + p.sin(p.frameCount * 0.02 + this.seed) * 0.5; this.y += this.floatSpeedY;
            if (this.y <= this.targetY) {
              let limit = p.height / 3;
              if (this.y > limit - 30) { if (p.random() > p.map(this.y, limit - 30, limit + 20, 1.0, 0.1)) this.age = 5000; }
              this.isStar = true;
            }
          }
        }
        draw(p: p5, cp: any) {
          if (this.age > 4000) return;
          p.push(); p.noStroke();
          let tSpeed = this.isStar ? cp.starTwinkleSpeed + (this.seed % (cp.starTwinkleSpeed * 2)) : 0.05;
          let breath = p.map(p.sin(p.frameCount * tSpeed + this.seed), -1, 1, 0.3, 1);
          let currentSize = (this.isStar ? cp.starSize * this.sizeMultiplier : this.maxSize) * breath;
          let limit = p.height / 3;
          let yAlpha = this.isStar ? p.map(this.y, 0, limit, 255, 0) : 255;
          let finalAlpha = p.min(this.age * 5, p.constrain(yAlpha, 0, 255)) * cp.starBrightness * this.individualBrightness;
          let drawColor = this.isStar ? p.color(cp.starColor) : this.color;
          drawColor.setAlpha(finalAlpha); p.translate(this.x, this.y);
          if (this.isStar && cp.starGlow > 0) (p.drawingContext as any).filter = `blur(${cp.starGlow}px)`;
          if (!this.isStar) {
            p.rotate(p.frameCount * 0.01 + this.seed);
            for (let l = 3; l > 0; l--) { drawColor.setAlpha(finalAlpha / (l * 2)); p.fill(drawColor); let s = currentSize * l; p.ellipse(0, 0, s * 2, s * 0.3); p.ellipse(0, 0, s * 0.3, s * 2); p.ellipse(0, 0, s * 0.8, s * 0.8); }
          } else {
            for (let l = 3; l > 0; l--) { drawColor.setAlpha(finalAlpha / (l * 2.5)); p.fill(drawColor); let s = currentSize * l * 1.5; p.ellipse(0, 0, s * 2, s * 0.3); p.ellipse(0, 0, s * 0.3, s * 2); p.ellipse(0, 0, s * 0.8, s * 0.8); }
          }
          p.pop(); (p.drawingContext as any).filter = 'none';
        }
      }
    }; 

    p5Ref.current = new p5(sketch, renderRef.current!);
    return () => { p5Ref.current?.remove(); };
  }, []); 

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center relative overflow-hidden font-sans">
      <div ref={renderRef} className="shadow-2xl" />
      {showPanel && (
        <div className="absolute top-4 right-4 bg-white/90 p-5 rounded-xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto backdrop-blur-md border border-gray-200 z-10">
          <div className="flex justify-between items-center mb-4 text-gray-800">
            <h2 className="text-lg font-bold">控制面板</h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">按 H 隐藏</span>
          </div>

          <div className="space-y-6">
            {/* 1. 画卷与字体 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-green-600 rounded-full"></span>画卷与字体</h3>
              <div className="space-y-3">
                <input type="text" value={params.fontFamily} onChange={e => setParams({...params, fontFamily: e.target.value})} className="w-full text-xs border rounded p-1.5 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">字粗细: {params.fontWeight}<input type="range" min="100" max="900" step="100" value={params.fontWeight} onChange={e => setParams({...params, fontWeight: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">基础大小: {params.fontSizeBase}<input type="range" min="10" max="100" value={params.fontSizeBase} onChange={e => setParams({...params, fontSizeBase: Number(e.target.value)})} className="w-full" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">远端比例: {params.fontSizeMinRatio}<input type="range" min="0.05" max="1" step="0.05" value={params.fontSizeMinRatio} onChange={e => setParams({...params, fontSizeMinRatio: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">漂动速度: {params.waveSpeed}<input type="range" min="0.001" max="0.05" step="0.001" value={params.waveSpeed} onChange={e => setParams({...params, waveSpeed: Number(e.target.value)})} className="w-full" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">整体弯曲: {params.curveAmp}<input type="range" min="0" max="100" value={params.curveAmp} onChange={e => setParams({...params, curveAmp: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">纵向起伏: {params.waveAmpY}<input type="range" min="0" max="100" value={params.waveAmpY} onChange={e => setParams({...params, waveAmpY: Number(e.target.value)})} className="w-full" /></label>
                </div>
                <label className="block text-[10px]">横向摇摆: {params.waveAmpX}<input type="range" min="0" max="100" value={params.waveAmpX} onChange={e => setParams({...params, waveAmpX: Number(e.target.value)})} className="w-full" /></label>
              </div>
            </div>

            {/* 2. 璀璨星尘 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-yellow-400 rounded-full"></span>璀璨星尘</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs"><span>星尘颜色</span><input type="color" value={params.particleColor} onChange={e => setParams({...params, particleColor: e.target.value})} className="w-6 h-6" /></div>
                <label className="block text-[10px]">生成概率: {(params.particleProb * 100).toFixed(0)}%<input type="range" min="0" max="1" step="0.01" value={params.particleProb} onChange={e => setParams({...params, particleProb: Number(e.target.value)})} className="w-full accent-yellow-400" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">星尘大小: {params.particleSize}px<input type="range" min="1" max="20" value={params.particleSize} onChange={e => setParams({...params, particleSize: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">漂浮速度: {params.particleFloatSpeed}<input type="range" min="0.1" max="5" step="0.1" value={params.particleFloatSpeed} onChange={e => setParams({...params, particleFloatSpeed: Number(e.target.value)})} className="w-full" /></label>
                </div>
              </div>
            </div>

            {/* 3. 天空星辰 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-purple-500 rounded-full"></span>天空星辰 (定格)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs"><span>星辰颜色</span><input type="color" value={params.starColor} onChange={e => setParams({...params, starColor: e.target.value})} className="w-6 h-6" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">朦胧感: {params.starGlow}<input type="range" min="0" max="10" step="0.5" value={params.starGlow} onChange={e => setParams({...params, starGlow: Number(e.target.value)})} className="w-full accent-purple-500" /></label>
                  <label className="text-[10px]">整体亮度: {params.starBrightness}<input type="range" min="0.1" max="2.0" step="0.1" value={params.starBrightness} onChange={e => setParams({...params, starBrightness: Number(e.target.value)})} className="w-full accent-purple-500" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">星辰大小: {params.starSize}px<input type="range" min="1" max="10" step="0.5" value={params.starSize} onChange={e => setParams({...params, starSize: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">最大数量: {params.maxStars}<input type="range" min="50" max="1000" step="10" value={params.maxStars} onChange={e => setParams({...params, maxStars: Number(e.target.value)})} className="w-full" /></label>
                </div>
                <label className="block text-[10px]">闪烁频率: {params.starTwinkleSpeed}<input type="range" min="0.005" max="0.1" step="0.005" value={params.starTwinkleSpeed} onChange={e => setParams({...params, starTwinkleSpeed: Number(e.target.value)})} className="w-full" /></label>
              </div>
            </div>

            {/* 4. 涟漪参数 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-cyan-500 rounded-full"></span>涟漪参数</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px]">最小大小: {params.rippleSizeMin}<input type="range" min="5" max="50" value={params.rippleSizeMin} onChange={e => setParams({...params, rippleSizeMin: Number(e.target.value)})} className="w-full" /></label>
                <label className="text-[10px]">最大大小: {params.rippleSizeMax}<input type="range" min="20" max="150" value={params.rippleSizeMax} onChange={e => setParams({...params, rippleSizeMax: Number(e.target.value)})} className="w-full" /></label>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <label className="text-[10px]">扩散速度: {params.rippleSpeed}<input type="range" min="0.1" max="5" step="0.1" value={params.rippleSpeed} onChange={e => setParams({...params, rippleSpeed: Number(e.target.value)})} className="w-full" /></label>
                <label className="text-[10px]">初始透明: {params.rippleAlpha}<input type="range" min="10" max="255" value={params.rippleAlpha} onChange={e => setParams({...params, rippleAlpha: Number(e.target.value)})} className="w-full" /></label>
              </div>
            </div>

            {/* 5. 线状雨滴 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-blue-500 rounded-full"></span>线状雨滴</h3>
              <div className="space-y-3">
                <label className="block text-[10px]">同屏密度: {params.rainDensity}<input type="range" min="0" max="500" step="10" value={params.rainDensity} onChange={e => setParams({...params, rainDensity: Number(e.target.value)})} className="w-full accent-blue-500" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">最小速度: {params.rainSpeedMin}<input type="range" min="1" max="30" value={params.rainSpeedMin} onChange={e => setParams({...params, rainSpeedMin: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">最大速度: {params.rainSpeedMax}<input type="range" min="5" max="50" value={params.rainSpeedMax} onChange={e => setParams({...params, rainSpeedMax: Number(e.target.value)})} className="w-full" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">
                    最小长度: {params.rainLengthMin}px
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={params.rainLengthMin} 
                      onChange={e => setParams({...params, rainLengthMin: Number(e.target.value)})} 
                      className="w-full accent-blue-500" 
                    />
                  </label>
                  <label className="text-[10px]">
                    最大长度: {params.rainLengthMax}px
                    <input 
                      type="range" 
                      min="20" 
                      max="250" 
                      value={params.rainLengthMax} 
                      onChange={e => setParams({...params, rainLengthMax: Number(e.target.value)})} 
                      className="w-full accent-blue-500" 
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px]">最小粗细: {params.rainWeightMin}<input type="range" min="0.5" max="5" step="0.5" value={params.rainWeightMin} onChange={e => setParams({...params, rainWeightMin: Number(e.target.value)})} className="w-full" /></label>
                  <label className="text-[10px]">最大粗细: {params.rainWeightMax}<input type="range" min="1" max="10" step="0.5" value={params.rainWeightMax} onChange={e => setParams({...params, rainWeightMax: Number(e.target.value)})} className="w-full" /></label>
                </div>
              </div>
            </div>

            {/* 6. 色彩参数 */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-pink-500 rounded-full"></span>色彩参数</h3>
              <div className="space-y-2">
                {[{ label: '天空色', key: 'bgTopColor' }, { label: '远山色', key: 'bgMidColor' }, { label: '星云色', key: 'mountainColor' }, { label: '文字色', key: 'textColor' }, { label: '飞鸟色', key: 'birdColor' }].map(item => (
                  <div key={item.key} className="flex justify-between items-center text-[10px]">
                    <span>{item.label}</span>
                    <input type="color" value={(params as any)[item.key]} onChange={e => setParams({...params, [item.key]: e.target.value})} className="w-5 h-5 cursor-pointer" />
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <label className="block text-[10px] mb-2 font-bold">雨滴色板</label>
                  <div className="flex gap-1 justify-between">
                    {['rainColor1', 'rainColor2', 'rainColor3', 'rainColor4', 'rainColor5'].map(key => (
                      <input key={key} type="color" value={(params as any)[key]} onChange={e => setParams({...params, [key]: e.target.value})} className="w-8 h-8 cursor-pointer rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-green-500 text-white'}`}>{isPlaying ? '暂停' : '开始'}</button>
              <button onClick={() => { setParams({...params, rainDensity: 0}); resetTrigger.current = true; }} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold border border-red-100 hover:bg-red-100">清空雨水与星辰</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}