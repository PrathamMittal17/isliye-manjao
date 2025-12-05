import './style.css'

const app = document.querySelector('#app')

const state = {
  phase: 'scratch',
  revealedCount: 0,
}

const cards = [
  {
    id: 'card1',
    img: '/saree.jpeg',
    text: 'Cause she in Saree is all the fireworks I ever need',
    emoji: '🎆',
    emojiClass: 'fireworks',
    laneEmoji: '🎆',
  },
  {
    id: 'card2',
    img: '/wow.jpeg',
    text: 'Cause she always blows my hosh away',
    emoji: '🤯',
    emojiClass: 'wow',
    laneEmoji: '🤯',
  },
  {
    id: 'card3',
    img: '/eyes.jpg',
    text: 'Cause she is the most beautiful thing I could watch forever',
    emoji: '👀',
    emojiClass: 'eyes',
    laneEmoji: '👀',
  },
]

function render() {
  app.innerHTML = `
    <main class="card">
      <header class="card-header">
        <span class="chip-soft">our soft little game</span>
        <span class="chip-badge">
          <span class="heart">♥</span>
          isliye manjao
        </span>
      </header>

      <section id="scratch-screen" class="screen ${state.phase === 'scratch' ? 'active' : ''}">
        ${cards
          .map(
            (c, index) => `
          <article class="scratch-card" data-id="${c.id}">
            <div class="scratch-stack">
              <img src="${c.img}" alt="photo ${index + 1}" class="scratch-image" />
              <canvas class="scratch-canvas" data-id="${c.id}"></canvas>
              <div class="tap-indicator" data-tap-for="${c.id}" style="display:none;">
                <span class="tap-icon">👆</span>
                tap me
              </div>
            </div>
            <p class="scratch-caption" data-caption-for="${c.id}" style="display:none;">
              ${c.text}
              <span class="scratch-emoji ${c.emojiClass}">${c.emoji}</span>
            </p>
          </article>
        `,
          )
          .join('')}

        <div class="nav-dots">
          ${cards
            .map(
              (c, i) => `<span class="nav-dot ${i < state.revealedCount ? 'active' : ''}"></span>`,
            )
            .join('')}
        </div>

        <div class="center-btn">
          <button class="btn btn-secondary btn-small" id="start-game-btn" ${
            state.revealedCount === cards.length ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'
          }>
            🎮 start our tiny game
          </button>
        </div>
      </section>

      <section id="game-screen" class="screen ${state.phase === 'game' ? 'active' : ''}">
        <div class="game-wrapper">
          <div class="game-header">
            <span>drag her to the right lane</span>
            <span id="score-label">score: 0</span>
          </div>
          <div class="game-board" id="game-board">
            <div class="lane-labels">
              <span>🎆</span>
              <span>🤯</span>
              <span>👀</span>
            </div>
            <div class="lane-divider"></div>
            <div class="lane-divider"></div>
          </div>
          <p class="game-footer">enemies fall with emojis — match her lane to gently beat them.</p>
        </div>
      </section>
    </main>
  `

  setupScratch()
  if (state.phase === 'game') {
    setupGame()
  }
}

function setupScratch() {
  const articles = document.querySelectorAll('.scratch-card')
  articles.forEach((article) => {
    const canvas = article.querySelector('.scratch-canvas')
    const img = article.querySelector('.scratch-image')
    const id = canvas.dataset.id

    const ctx = canvas.getContext('2d')
    let isDrawing = false
    let erasedRatio = 0

    function resize() {
      const rect = article.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.width * 0.7
      img.style.height = canvas.height + 'px'
      img.style.objectFit = 'cover'
      ctx.fillStyle = '#fecaca'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fb7185'
      ctx.font = '14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('drag to scratch me', canvas.width / 2, canvas.height / 2)
      ctx.globalCompositeOperation = 'destination-out'
    }

    resize()
    window.addEventListener('resize', resize)

    const handleStart = (e) => {
      e.preventDefault()
      isDrawing = true
      eraseAtEvent(e)
    }

    const handleMove = (e) => {
      if (!isDrawing) return
      eraseAtEvent(e)
      checkErased()
    }

    const handleEnd = () => {
      isDrawing = false
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      return { x, y }
    }

    function eraseAtEvent(e) {
      const { x, y } = getPos(e)
      const radius = 26
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    function checkErased() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let cleared = 0
      let total = 0

      const step = 6
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4 + 3
          total++
          if (pixels.data[i] === 0) cleared++
        }
      }

      erasedRatio = cleared / total
      if (erasedRatio > 0.4) {
        revealCard(id, canvas)
      }
    }

    canvas.addEventListener('mousedown', handleStart)
    canvas.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)

    canvas.addEventListener('touchstart', handleStart, { passive: false })
    canvas.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
  })

  // allow tapping the floating chip to force reveal
  document.querySelectorAll('.tap-indicator').forEach((tap) => {
    tap.addEventListener('click', () => {
      const id = tap.dataset.tapFor
      const canvas = document.querySelector(`.scratch-canvas[data-id="${id}"]`)
      if (canvas) {
        revealCard(id, canvas)
      }
    })
  })

  const startBtn = document.querySelector('#start-game-btn')
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (state.revealedCount === cards.length) {
        state.phase = 'game'
        render()
      }
    })
  }
}

function revealCard(id, canvas) {
  canvas.style.opacity = '0'
  canvas.style.pointerEvents = 'none'

  const caption = document.querySelector(`[data-caption-for="${id}"]`)
  const tap = document.querySelector(`[data-tap-for="${id}"]`)
  if (caption) caption.style.display = 'block'
  if (tap) tap.style.display = 'flex'

  const alreadyRevealed = canvas.dataset.revealed === '1'
  if (!alreadyRevealed) {
    canvas.dataset.revealed = '1'
    state.revealedCount = Math.min(cards.length, state.revealedCount + 1)
    const dots = document.querySelectorAll('.nav-dot')
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < state.revealedCount)
    })
    const startBtn = document.querySelector('#start-game-btn')
    if (startBtn && state.revealedCount === cards.length) {
      startBtn.disabled = false
      startBtn.style.opacity = '1'
      startBtn.style.cursor = 'pointer'
    }
  }
}

function setupGame() {
  const board = document.querySelector('#game-board')
  if (!board) return

  let score = 0
  const scoreLabel = document.querySelector('#score-label')

  const lanes = 3
  const boardRect = board.getBoundingClientRect()
  const laneWidth = boardRect.width / lanes

  const hero = document.createElement('div')
  hero.className = 'hero'
  hero.style.left = boardRect.left + laneWidth * 1.5 - 40 + 'px'

  const heroImg = document.createElement('img')
  heroImg.src = cards[0].img
  hero.appendChild(heroImg)
  board.appendChild(hero)

  let heroLane = 1
  let isDragging = false
  let dragOffsetX = 0

  function setHeroLaneFromX(x) {
    const localX = x - boardRect.left
    let lane = Math.floor(localX / laneWidth)
    lane = Math.max(0, Math.min(lanes - 1, lane))
    heroLane = lane
    hero.style.left = boardRect.left + laneWidth * (lane + 0.5) - 40 + 'px'
  }

  function heroStart(e) {
    e.preventDefault()
    isDragging = true
    const rect = hero.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    dragOffsetX = clientX - rect.left
  }

  function heroMove(e) {
    if (!isDragging) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const x = clientX - dragOffsetX + 40
    setHeroLaneFromX(x)
  }

  function heroEnd() {
    isDragging = false
  }

  hero.addEventListener('mousedown', heroStart)
  window.addEventListener('mousemove', heroMove)
  window.addEventListener('mouseup', heroEnd)

  hero.addEventListener('touchstart', heroStart, { passive: false })
  window.addEventListener('touchmove', heroMove, { passive: false })
  window.addEventListener('touchend', heroEnd)

  const enemies = []
  const enemySpeed = 1.2

  function spawnEnemy() {
    const enemy = document.createElement('div')
    enemy.className = 'enemy'
    const lane = Math.floor(Math.random() * lanes)
    const types = ['🎆', '🤯', '👀']
    const emoji = types[Math.floor(Math.random() * types.length)]
    enemy.textContent = emoji

    const x = laneWidth * (lane + 0.5) - 21
    enemy.style.left = x + 'px'
    enemy.style.top = '-40px'

    board.appendChild(enemy)
    enemies.push({ el: enemy, lane, emoji, y: -40 })
  }

  let lastSpawn = performance.now()

  function loop(now) {
    const dt = now - lastSpawn
    if (dt > 900) {
      spawnEnemy()
      lastSpawn = now
    }

    const heroRect = hero.getBoundingClientRect()
    const heroY = heroRect.top

    enemies.forEach((e, index) => {
      e.y += enemySpeed
      e.el.style.top = e.y + 'px'

      const enemyRect = e.el.getBoundingClientRect()
      if (enemyRect.bottom >= heroY && enemyRect.top <= heroY + heroRect.height) {
        const heroEmoji = cards[0].laneEmoji
        if (heroLane === e.lane && heroEmoji === e.emoji) {
          e.el.classList.add('pop')
          score += 1
          if (scoreLabel) scoreLabel.textContent = `score: ${score}`
          setTimeout(() => {
            if (e.el.parentNode) e.el.parentNode.removeChild(e.el)
          }, 200)
          enemies.splice(index, 1)
        }
      }

      if (e.y > boardRect.height + 50) {
        if (e.el.parentNode) e.el.parentNode.removeChild(e.el)
        enemies.splice(index, 1)
      }
    })

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

render()
