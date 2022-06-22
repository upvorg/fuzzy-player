import Player from '../../packages/core/src/index'
import { html, render } from 'lit'
import { VIDEO_EVENTS } from '../../packages/core/src/constants'
import hls from '../../packages/core/plugins/hls'
import ui from '../../packages/ui/src/index'
import { live } from 'lit/directives/live.js'

const $container = document.getElementById('app')!
const $meta = document.getElementById('meta')!

const dataSrcs = [
  'https://v.v1kd.com/20220507/AQzU93SJ/2000kb/hls/index.m3u8',
  'https://ukzyvod3.ukubf5.com/20220410/yAU8vUFg/2000kb/hls/index.m3u8',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4'
] as const

const querySrc = new URLSearchParams(window.location.search).get('src')
let src = querySrc || dataSrcs[0]
let currentDataSrcId = querySrc ? -1 : 0

const quailitySrcs = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
] as const

const p = Player.make($container, {
  volume: 0.1,
  autoplay: true,
  source: {
    src,
    poster: 'https://media.w3.org/2010/05/sintel/poster.png'
  }
})
  .use([ui, hls])
  .create()

const meta = () => html`
  <b>Oh-Player v${Player.version} </b>
  <p>Plugin: ${p.plugins.toString()}</p>
    <span class="${p.isLoading ? 'loading' : ''}">
      ${p.isLoading ? '✳️' : p.isLoaded ? '✅' : '❌'}
    </span>
  </p>

  <p>
    <input
      type="text"
      @input=${(e: any) => (src = e.target.value)}
      style="flex:1;"
      .value=${live(src)}
    />

    <button @click=${() => p.changeSource(src)}>ChangeSource</button>
  </p>

  <p>
    seek:
    <input
      type="range"
      @input=${(e: any) => p.seek(e.target.value)}
      min="0"
      max=${p.duration}
      step="0.1"
      value=${p.currentTime}
    />
  </p>

  <p>
    Vol&nbsp;&nbsp;:
    <input
      type="range"
      @input=${(e: any) => p.setVolume(e.target.value)}
      min="0"
      max="1"
      step="0.1"
      value=${p.volume}
    />
  </p>

  <p>
    Rate:
    <input
      type="range"
      @input=${(e: any) => p.setPlaybackRate(e.target.value)}
      min="0.5"
      max="5"
      step="0.1"
      value=${p.playbackRate}
    />
  </p>

  <p>
    <button
      @click=${() => {
        src =
          dataSrcs[
            currentDataSrcId + 1 >= dataSrcs.length
              ? (currentDataSrcId = 0)
              : (currentDataSrcId += 1)
          ]!
        p.changeSource(src)
      }}
    >
      QueueSource
    </button>
  </p>
`

p.on((e) => {
  if (Object.values(VIDEO_EVENTS).includes(e.type as any) && e.type != 'timeupdate') {
    console.log(e)
    render(meta(), $meta)
  }
})

render(meta(), $meta)

console.log(p)
