function HeroSection({ heroSrc, isLoading, onImageLoad, monthLabel, yearLabel }) {
  return (
    <div className="relative h-56 sm:h-64 md:h-72">
      {isLoading && <div className="absolute inset-0 z-10 animate-pulse bg-slate-300/70" />}
      <img
        src={heroSrc}
        alt="Mountain climber on a wall calendar hero"
        className={[
          'h-full w-full object-cover transition-opacity duration-500',
          isLoading ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
        onLoad={onImageLoad}
        onError={onImageLoad}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent" />
      <div className="absolute -bottom-4 left-0 right-0 z-1 h-28 bg-white [clip-path:polygon(0_48%,34%_100%,100%_74%,100%_100%,0_100%)]" />
      <div className="absolute bottom-10 left-4 z-20 flex flex-col gap-1 leading-none sm:bottom-12 sm:left-6 sm:gap-2">
        <p className="text-3xl font-semibold tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-4xl">
          {monthLabel}
        </p>
        <p className="text-lg font-medium tracking-wide text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-xl">
          {yearLabel}
        </p>
      </div>
    </div>
  )
}

export default HeroSection
