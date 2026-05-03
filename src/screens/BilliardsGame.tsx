import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCcw, Maximize2 } from 'lucide-react';
import * as Matter from 'matter-js';

const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const BALL_RADIUS = 10;
const CUE_LENGTH = 300;

export const BilliardsGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [cueAngle, setCueAngle] = useState(0);
  const [whiteBall, setWhiteBall] = useState<Matter.Body | null>(null);
  const [isStriking, setIsStriking] = useState(false);
  const [placementMode, setPlacementMode] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const availableWidth = container.clientWidth - 40;
        const availableHeight = container.clientHeight - 40;
        
        let width = availableWidth;
        let height = availableWidth / 2;
        
        if (height > availableHeight) {
          height = availableHeight;
          width = height * 2;
        }
        
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Use dynamic dimensions
    const { width, height } = dimensions;

    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    engineRef.current = engine;
    
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: '#076324',
        wireframes: false,
      }
    });

    const wallOptions = { isStatic: true, restitution: 0.8, friction: 0.1, render: { fillStyle: '#4d2600' } };
    const walls = [
      Bodies.rectangle(width/2, -10, width, 40, wallOptions),
      Bodies.rectangle(width/2, height+10, width, 40, wallOptions),
      Bodies.rectangle(-10, height/2, 40, height, wallOptions),
      Bodies.rectangle(width+10, height/2, 40, height, wallOptions),
    ];

    const cueBall = Bodies.circle(width * 0.25, height/2, BALL_RADIUS, {
      restitution: 0.9,
      friction: 0.01,
      frictionAir: 0.01,
      label: 'cueBall',
      render: { fillStyle: '#ffffff' }
    });
    setWhiteBall(cueBall);

    const rack: Matter.Body[] = [];
    const startX = width * 0.75;
    const startY = height / 2;
    const colors = ['#f1c40f', '#2ecc71', '#e74c3c', '#9b59b6', '#34495e', '#f39c12', '#d35400', '#c0392b', '#1abc9c', '#27ae60'];
    
    let count = 0;
    for (let i = 0; i < 5; i++) {
       for (let j = 0; j <= i; j++) {
         const x = startX + i * (BALL_RADIUS * 1.8);
         const y = startY + (j - i/2) * (BALL_RADIUS * 2.1);
         rack.push(Bodies.circle(x, y, BALL_RADIUS, {
            restitution: 0.95, friction: 0.01, frictionAir: 0.01,
            render: { fillStyle: colors[count % colors.length] }
         }));
         count++;
       }
    }

    World.add(engine.world, [...walls, cueBall, ...rack]);
    Matter.Runner.run(engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      Engine.clear(engine);
    };
  }, [dimensions]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isStriking) return;
    if (placementMode) {
       setPlacementMode(false);
       return;
    }
    setIsCharging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!whiteBall || isStriking) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    const mX = (e.clientX - rect.left) * scaleX;
    const mY = (e.clientY - rect.top) * scaleY;
    
    if (placementMode) {
       Body.setPosition(whiteBall, { 
          x: Math.min(Math.max(mX, BALL_RADIUS + 10), dimensions.width * 0.3), 
          y: Math.min(Math.max(mY, BALL_RADIUS + 10), dimensions.height - BALL_RADIUS - 10) 
       });
    } else {
       setCueAngle(Math.atan2(mY - whiteBall.position.y, mX - whiteBall.position.x));
    }
  };

  const handlePointerUp = () => {
    if (!isCharging || !whiteBall) return;
    setIsCharging(false);
    
    const strength = power / 1500;
    const fX = Math.cos(cueAngle) * strength * -1;
    const fY = Math.sin(cueAngle) * strength * -1;
    
    Body.applyForce(whiteBall, whiteBall.position, { x: fX, y: fY });
    
    setIsStriking(true);
    setPower(0);
    setTimeout(() => setIsStriking(false), 2000);
  };

  useEffect(() => {
    if (isCharging) {
      const interval = setInterval(() => setPower(p => (p < 100 ? p + 2 : p)), 20);
      return () => clearInterval(interval);
    }
  }, [isCharging]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-screen bg-black flex flex-col font-sans overflow-hidden">
      <div className="p-4 flex items-center justify-between z-30">
        <button onClick={onBack} className="p-3 bg-white/10 rounded-full"><ArrowLeft size={24} /></button>
        <div className="text-center">
          <h2 className="text-gold text-2xl font-bold">Pro Billiards</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{placementMode ? 'PLACE THE BALL' : 'READY'}</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-3 bg-white/10 rounded-full"><RefreshCcw size={24} /></button>
      </div>

      <div 
        ref={containerRef} 
        onPointerMove={handlePointerMove} 
        onPointerDown={handlePointerDown} 
        onPointerUp={handlePointerUp}
        className="flex-1 flex items-center justify-center relative touch-none"
      >
        <div className="relative border-[12px] border-[#3d1a00] rounded-xl shadow-2xl">
           <canvas ref={canvasRef} className="rounded-sm" />
           {whiteBall && !isStriking && !placementMode && (
             <div className="absolute pointer-events-none" style={{ left: whiteBall.position.x, top: whiteBall.position.y }}>
               <div className="absolute h-[1px] border-t border-dashed border-white/50" style={{ width: 400, transformOrigin: '0 0', transform: `rotate(${cueAngle + Math.PI}rad)` }} />
               <motion.div 
                 className="absolute bg-gradient-to-r from-[#d2b48c] to-[#3d1a00] h-2 rounded-full"
                 style={{
                   width: CUE_LENGTH, transformOrigin: '0 50%',
                   x: Math.cos(cueAngle) * (BALL_RADIUS + 20 + (isCharging ? power/2 : 0)),
                   y: Math.sin(cueAngle) * (BALL_RADIUS + 20 + (isCharging ? power/2 : 0)),
                   transform: `rotate(${cueAngle}rad)`
                 }}
               />
             </div>
           )}
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
           <div className="w-6 h-40 bg-white/5 border border-white/10 rounded-full relative overflow-hidden">
              <motion.div className="absolute bottom-0 left-0 right-0 bg-gold" style={{ height: `${power}%` }} />
           </div>
           <p className="text-[10px] font-bold text-white/40 uppercase">Power</p>
        </div>
      </div>
    </motion.div>
  );
};
