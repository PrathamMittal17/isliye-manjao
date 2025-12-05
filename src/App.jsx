import React, { useEffect, useRef, useState } from "react";
import "./style.css";

const cards = [
  {
    id: "card1",
    img: "/isliye-manjao/saree.jpeg",
    text: "Cause she in Saree is all the fireworks I ever need",
    emoji: "🎆",
    emojiClass: "fireworks",
    laneEmoji: "🎆",
  },
  {
    id: "card2",
    img: "/isliye-manjao/wow.jpeg",
    text: "Cause she always blows my hosh away",
    emoji: "🤯",
    emojiClass: "wow",
    laneEmoji: "🤯",
  },
  {
    id: "card3",
    img: "/isliye-manjao/eyes.jpg",
    text: "Cause she is the most beautiful thing I could watch forever",
    emoji: "👀",
    emojiClass: "eyes",
    laneEmoji: "👀",
  },
];

function ScratchCard({ card, onReveal }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || revealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;

    function setup() {
      const rect = container.getBoundingClientRect();
      const img = container.querySelector(".scratch-image");
      const height = img ? img.getBoundingClientRect().height : rect.width * 0.7;
      canvas.width = rect.width;
      canvas.height = height;
      ctx.globalCompositeOperation = "source-over";
      // soft gradient overlay
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#ffd6ec");
      grad.addColorStop(1, "#fecaca");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // friendly hint text
      ctx.fillStyle = "#db2777";
      ctx.font = "16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("drag to reveal \u2764\ufe0f", canvas.width / 2, canvas.height / 2);
      ctx.globalCompositeOperation = "destination-out";
    }

    // wait a tick for image to lay out on mobile
    requestAnimationFrame(setup);

    let isDrawing = false;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function eraseAt(e) {
      const { x, y } = getPos(e);
      const radius = 26;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkRevealed() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let cleared = 0;
      let total = 0;
      const step = 6;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4 + 3;
          total++;
          if (pixels.data[i] === 0) cleared++;
        }
      }
      const ratio = total ? cleared / total : 0;
      if (ratio > 0.4) {
        doReveal();
      }
    }

    function handleStart(e) {
      e.preventDefault();
      isDrawing = true;
      eraseAt(e);
    }

    function handleMove(e) {
      if (!isDrawing) return;
      eraseAt(e);
      checkRevealed();
    }

    function handleEnd() {
      isDrawing = false;
    }

    function doReveal() {
      if (revealed) return;
      setRevealed(true);
      canvas.style.opacity = "0";
      canvas.style.pointerEvents = "none";
      onReveal(card.id);
      cleanup();
    }

    function cleanup() {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("resize", setup);
    }

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("resize", setup);

    return cleanup;
  }, [card.id, onReveal, revealed]);

  return (
    <article className="scratch-card" data-id={card.id}>
      <div className="scratch-stack" ref={containerRef}>
        <img src={card.img} alt="her" className="scratch-image" />
        <canvas ref={canvasRef} className="scratch-canvas" />
      </div>
      {revealed && (
        <p className="scratch-caption">
          {card.text}
          <span className={`scratch-emoji ${card.emojiClass}`}>{card.emoji}</span>
        </p>
      )}
    </article>
  );
}

function EmojiGame({ selectedIndex, onTargetChange, onGameOver }) {
  const boardRef = useRef(null);
  const heroRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(10);
  const [targetIndex, setTargetIndex] = useState(() => Math.floor(Math.random() * cards.length));
  const [gameOver, setGameOver] = useState(false);
  const livesRef = useRef(lives);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const board = boardRef.current;
    if (!board) return;

    const lanes = 3;
    let boardRect = board.getBoundingClientRect();
    let laneWidth = boardRect.width / lanes;

    const hero = document.createElement("div");
    hero.className = "hero";
    const heroImg = document.createElement("img");
    const heroCard = cards[selectedIndex] ?? cards[0];
    heroImg.src = heroCard.img;
    hero.appendChild(heroImg);
    board.appendChild(hero);
    heroRef.current = hero;

    let heroLane = 1;
    let isDragging = false;
    let dragOffsetX = 0;

    function placeHeroInLane(lane) {
      boardRect = board.getBoundingClientRect();
      laneWidth = boardRect.width / lanes;
      heroLane = lane;
      const x = laneWidth * (lane + 0.5) - 40; // local to board
      hero.style.left = x + "px";
    }

    placeHeroInLane(1);

    function heroStart(e) {
      e.preventDefault();
      isDragging = true;
      const rect = hero.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      dragOffsetX = clientX - rect.left;
    }

    function heroMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const localX = clientX - boardRect.left - dragOffsetX + 40;
      let lane = Math.floor(localX / laneWidth);
      lane = Math.max(0, Math.min(lanes - 1, lane));
      placeHeroInLane(lane);
    }

    function heroEnd() {
      isDragging = false;
    }

    hero.addEventListener("mousedown", heroStart);
    window.addEventListener("mousemove", heroMove);
    window.addEventListener("mouseup", heroEnd);
    hero.addEventListener("touchstart", heroStart, { passive: false });
    window.addEventListener("touchmove", heroMove, { passive: false });
    window.addEventListener("touchend", heroEnd);

    const enemies = [];
    const enemySpeed = 0.7;

    function spawnEnemy() {
      const enemy = document.createElement("div");
      enemy.className = "enemy";
      const lane = Math.floor(Math.random() * lanes);
      // drop random collectible emojis
      const types = ["🎆", "🤯", "👀"];
      const emoji = types[Math.floor(Math.random() * types.length)];
      enemy.textContent = emoji;
      const x = laneWidth * (lane + 0.5) - 21;
      enemy.style.left = x + "px";
      enemy.style.top = "-40px";
      board.appendChild(enemy);
      enemies.push({ el: enemy, lane, emoji, y: -40 });
    }

    let lastSpawn = performance.now();
    let frameId;

    function loop(now) {
      if (gameOver || livesRef.current <= 0) {
        cancelAnimationFrame(frameId);
        setGameOver(true);
        if (onGameOver) onGameOver();
        return;
      }
      frameId = requestAnimationFrame(loop);
      const dt = now - lastSpawn;
      if (dt > 2500) {
        spawnEnemy();
        lastSpawn = now;
      }

      const heroRect = hero.getBoundingClientRect();
      const heroY = heroRect.top;

      enemies.forEach((e, index) => {
        e.y += enemySpeed;
        e.el.style.top = e.y + "px";

        const enemyRect = e.el.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const heroY = heroRect.top;
        
        // Only detect collision from above (enemy falling down onto hero)
        const collidingFromAbove = enemyRect.bottom >= heroY && enemyRect.top < heroY;
        
        // Check horizontal overlap
        const horizontalOverlap = enemyRect.left < heroRect.right && enemyRect.right > heroRect.left;
        
        if (collidingFromAbove && horizontalOverlap) {
          const heroEmoji = (cards[selectedIndexRef.current] ?? cards[0]).laneEmoji;
          const targetEmoji = (cards[targetIndex] ?? cards[0]).laneEmoji;
          
          // Case 1: Correct character + correct emoji = +1 score
          if (heroEmoji === targetEmoji && e.emoji === targetEmoji) {
            e.el.classList.add("pop");
            setScore((s) => s + 1);
            setTimeout(() => {
              if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
            }, 200);
            enemies.splice(index, 1);
            return;
          }
          
          // Case 2: Wrong character touching target emoji = -1 life
          // Case 3: Any character touching wrong emoji = -1 life
          if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
          enemies.splice(index, 1);
          setLives((current) => (current > 0 ? current - 1 : 0));
          return;
        }

        // missed enemy past bottom: no life penalty
        if (e.y > boardRect.height + 50) {
          if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
          enemies.splice(index, 1);
        }
      });
    }

    frameId = requestAnimationFrame(loop);

    function handleResize() {
      boardRect = board.getBoundingClientRect();
      laneWidth = boardRect.width / lanes;
      placeHeroInLane(heroLane);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      hero.removeEventListener("mousedown", heroStart);
      window.removeEventListener("mousemove", heroMove);
      window.removeEventListener("mouseup", heroEnd);
      hero.removeEventListener("touchstart", heroStart);
      window.removeEventListener("touchmove", heroMove);
      window.removeEventListener("touchend", heroEnd);
      enemies.forEach((e) => {
        if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
      });
      if (hero.parentNode) hero.parentNode.removeChild(hero);
    };
  }, [gameOver]);

  // change target emoji randomly mid-game
  useEffect(() => {
    const id = setInterval(() => {
      setTargetIndex((prev) => {
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * cards.length);
        }
        return next;
      });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // update hero image when player switches character
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const img = hero.querySelector('img');
    if (img) img.src = (cards[selectedIndex] ?? cards[0]).img;
  }, [selectedIndex]);

  // notify parent when target changes
  useEffect(() => {
    if (onTargetChange) onTargetChange(targetIndex);
    // show flash on board briefly when target changes
    setShowFlash(true);
    const t = setTimeout(() => setShowFlash(false), 1200);
    return () => clearTimeout(t);
  }, [targetIndex, onTargetChange]);

  function restart() {
    setScore(0);
    setLives(10);
    setGameOver(false);
  }

  return (
    <section className="game-wrapper">
      <div className="game-header">
        <span id="score-label">score: {score} · lives: {lives}</span>
      </div>
      <div className="game-board" ref={boardRef}>
        {/* columns are now invisible; she just chases emojis */}
        <div className="lane-divider" />
        <div className="lane-divider" />
        {showFlash && (
          <div className="target-flash">
            collect
            <span className="flash-emoji">{cards[targetIndex].emoji}</span>
          </div>
        )}
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-card">
              <div className="game-over-title">game over</div>
              <button className="btn btn-secondary" type="button" onClick={restart}>
                restart with 10 lives
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="game-footer">
        emojis fall from the sky — match her lane with the ones that belong to her.
      </p>
    </section>
  );
}

export default function App() {
  const [phase, setPhase] = useState("scratch");
  const [revealedIds, setRevealedIds] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

  const handleReveal = (id) => {
    setRevealedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const allRevealed = revealedIds.length === cards.length;

  return (
    <main className="card">
      <header className="card-header">
        <span className="chip-badge">
          <span className="heart">♥</span>
          pls manjao game
        </span>
      </header>
      

      {phase === "scratch" && (
        <section className="screen active" id="scratch-screen">
          {cards.map((card) => (
            <ScratchCard key={card.id} card={card} onReveal={handleReveal} />
          ))}

          <div className="nav-dots">
            {cards.map((c, i) => (
              <span
                key={c.id}
                className={`nav-dot ${i < revealedIds.length ? "active" : ""}`}
              />
            ))}
          </div>

          <div className="center-btn">
            <button
              className="btn btn-secondary btn-small"
              type="button"
              disabled={!allRevealed}
              onClick={() => setPhase("game")}
              style={!allRevealed ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              🎮 start our tiny game
            </button>
          </div>

          
        </section>
      )}

      {phase === "game" && (
        <section className="screen active" id="game-screen">
          <EmojiGame
            selectedIndex={selectedIndex}
            onTargetChange={(i) => setCurrentTargetIndex(i)}
            onGameOver={() => {}}
          />
          {/* collect hint and character selector below the game */}
          <div className="collect-row">
            <span className="collect-badge">collect: <strong>{cards[currentTargetIndex].emoji}</strong></span>
          </div>
          <div className="selector-row">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                className={`circle-btn ${index === selectedIndex ? "active" : ""}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={index === 0 ? "saree" : index === 1 ? "wow" : "eyes"}
              >
                <img src={card.img} alt="character" />
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
