import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import FullScreenIcon from 'components/icons/full-screen';
import PauseIcon from 'components/icons/pause';
import PlayIcon from 'components/icons/play';

/**
 * Pads a given number with leading zeros until it reaches a certain length.
 * @param num - The number to pad.
 * @param size - The desired number of digits.
 * @return The padded number. Note that if the given `num` already has a length
 * equal to or greater than the requested `size`, nothing will happen.
 * @see {@link https://stackoverflow.com/a/2998822}
 */
export function pad(num: number, size: number): string {
  let str = num.toString();
  while (str.length < size) str = `0${str}`;
  return str;
}

/**
 * Converts milliseconds to a readable timestamp.
 * @param seconds - The seconds to convert into a timestamp.
 * @return The formatted timestamp (MM:SS).
 * @example
 * secondsToTimestamp(24.78); // Returns '00:25'
 */
export function secondsToTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${pad(mins, 2)}:${pad(secs, 2)}`;
}

export function toggleSelection(value: string): void {
  const style = document.body.style as unknown as Record<string, string>;
  style['user-select'] = value;
  style['-webkit-user-select'] = value;
  style['-moz-user-select'] = value;
  style['-ms-user-select'] = value;
}

export interface VideoProps {
  src: string;
  children: string;
  autoplay?: boolean;
  loop?: boolean;
}

export default function Video({
  src,
  children,
  autoplay,
  loop,
}: VideoProps): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const onEnter = useCallback(() => setVisible(true), []);
  const onLeave = useCallback(() => setVisible(false), []);

  const [playing, setPlaying] = useState<boolean>(autoplay || false);
  const togglePlayback = useCallback(async () => {
    if (!ref.current) return;
    if (ref.current.paused) {
      await ref.current.play();
      setPlaying(true);
    } else {
      ref.current.pause();
      setPlaying(false);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (ref.current) await ref.current.requestFullscreen();
  }, []);

  const [progress, setProgress] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const updateProgress = useCallback(() => {
    if (dragging || !ref.current?.currentTime || !ref.current?.duration) return;
    setProgress(ref.current.currentTime / ref.current.duration);
  }, [dragging]);

  useEffect(() => {
    if (!ref.current || !ref.current.duration) return;
    const updated = progress * ref.current.duration;
    if (progress === 1) setPlaying(false);
    if (Math.round(updated) === Math.round(ref.current.currentTime)) return;
    ref.current.currentTime = progress * ref.current.duration;
  }, [progress]);

  const updateDrag = useCallback(
    (event: MouseEvent) => {
      if (!dragging) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const updated = (event.clientX - bounds.left) / bounds.width;
      setProgress(Math.min(1, Math.max(0, updated)));
    },
    [dragging]
  );
  const endDrag = useCallback(
    (event: MouseEvent) => {
      setDragging(false);
      toggleSelection('');
      updateDrag(event);
    },
    [updateDrag]
  );
  const startDrag = useCallback(
    (event: MouseEvent) => {
      setDragging(true);
      toggleSelection('none');
      updateDrag(event);
    },
    [updateDrag]
  );

  const videoId = `${src.split('/').pop() as string}-video`;

  return (
    <figure>
      <div className='video' onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <div className='container'>
          <video
            id={videoId}
            onTimeUpdate={updateProgress}
            onDurationChange={updateProgress}
            autoPlay={autoplay}
            preload='auto'
            playsInline
            loop={loop}
            src={src}
            ref={ref}
          >
            <track kind='captions' />
          </video>
          <div className={cn('controls', { visible })}>
            <button className='play' type='button' onClick={togglePlayback}>
              {playing && <PauseIcon />}
              {!playing && <PlayIcon />}
            </button>
            <div className='time'>
              {secondsToTimestamp(ref.current?.currentTime || 0)}
            </div>
            <div className='progress'>
              <div
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onMouseDown={startDrag}
                onMouseMove={updateDrag}
                className='drag-handler'
                role='scrollbar'
                aria-label='Scroll video'
                aria-controls={videoId}
                aria-valuemin={0}
                aria-valuenow={progress * 100}
                aria-valuemax={100}
                tabIndex={-1}
              />
              <progress value={progress * 100} max='100' />
              <div style={{ left: `${progress * 100}%` }} className='handle' />
            </div>
            <div className='time'>
              {secondsToTimestamp(ref.current?.duration || 0)}
            </div>
            <button
              className='fullscreen'
              type='button'
              onClick={toggleFullscreen}
            >
              <FullScreenIcon />
            </button>
          </div>
        </div>
      </div>
      <figcaption>{children}</figcaption>
      <style jsx>{`
        figure {
          display: block;
          text-align: center;
          margin: 2rem auto;
        }

        figcaption {
          font-size: 0.9rem;
          font-style: italic;
          margin-top: 1rem;
          color: var(--accents-5);
        }

        div.video {
          margin: 0 auto;
          max-width: 100%;
          position: relative;
          font-family: var(--font-sans);
          border: 1px solid var(--accents-2);
        }

        div.controls div {
          position: relative;
        }

        video {
          height: 100%;
          left: 0;
          position: absolute;
          top: 0;
          width: 100%;
          cursor: pointer;
        }

        video:-webkit-full-screen {
          width: 100%;
          height: 100%;
          max-height: 100%;
          z-index: 99999999;
        }

        div.container {
          display: flex;
          justify-content: center;
          padding-bottom: calc(100% / 16 * 9);
          background-color: black;
        }

        div.controls {
          position: absolute;
          bottom: 5%;
          background: var(--background);
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          opacity: 0;
          width: 85%;
          transform: translate3d(0, 6px, 0);
          transition: all 0.2s cubic-bezier(0.25, 0.57, 0.45, 0.94);
        }

        div.controls.wide {
          width: 94.5%;
        }

        div.controls.visible {
          opacity: 1;
          transform: translateZ(0);
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.12);
          display: flex;
        }

        button.play {
          background: transparent;
          border: 0;
          height: 40px;
          width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          outline: 0;
          cursor: pointer;
          flex: 0 0 40px;
          padding: 0;
        }

        div.controls div.progress {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1 0 auto;
        }

        div.controls progress {
          background-color: var(--accents-2);
          height: 2px;
          width: 100%;
          position: absolute;
          top: calc(50% - 1px);
          left: 0;
          pointer-events: none;
        }

        div.controls div.progress div.handle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--on-background);
          transform: translateX(-4px) translateY(1px) scale(0);
          transition: width 0.1s ease, height 0.1s ease, border-radius 0.1s ease,
            transform 0.1s ease, background-color 0.1s ease;
          top: calc(50% - 6px);
          pointer-events: none;
        }

        div.controls div.progress div.thumb {
          position: absolute;
          background: var(--on-background);
          box-shadow: 0 4px 9px rgba(0, 0, 0, 0.12);
          transform: translate3d(0, 40px, 0) scale(0.8, 0);
          pointer-events: none;
          opacity: 0;
          background-size: cover;
        }

        @media (hover: hover) {
          div.controls div.progress:hover div.handle {
            transform: translateX(-4px) translateY(1px) scale(1);
          }

          div.controls div.progress div.drag-handler:hover ~ div.thumb {
            transform: translateZ(0) scaleY(0);
            opacity: 1;
          }
        }

        div.controls div.time {
          font-size: 12px;
          font-weight: 600;
          line-height: 40px;
          padding: 0 12px;
          flex: 0 0 auto;
          width: 60px;
        }

        button.play + div.time {
          padding-left: 0;
        }

        @media (max-width: 992px) {
          div.controls {
            opacity: 1;
            transform: translateZ(0) scaleY(0);
          }

          div.drag-handler {
            height: 18px;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
          }
        }

        @media (max-width: 480px) {
          .thumb {
            display: none;
          }
        }

        button.fullscreen {
          color: var(--on-background);
          background: transparent;
          border: 0;
          height: 40px;
          width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          outline: 0;
          cursor: pointer;
          flex: 0 0 40px;
          padding: 0;
        }

        div.drag-handler {
          width: 100%;
          height: 18px;
          background: transparent;
          cursor: pointer;
        }
      `}</style>
    </figure>
  );
}
