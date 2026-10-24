import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { featuredQuery } from '../api'

const ORB = 'linear-gradient(145.46deg, rgba(210, 138, 76, 0.3) 46.085%, rgba(210, 138, 76, 0) 103.28%)'

export function FeaturedBanner() {
  const featured = useQuery(featuredQuery)

  return (
    <section
      aria-labelledby="featured-title"
      className="relative flex h-[470px] w-[310px] shrink-0 items-start gap-[10px] overflow-clip bg-gradient-to-b from-[rgba(210,138,76,0.1)] to-[rgba(210,138,76,0.03)] pt-[24px] pb-[4px]"
    >
      <div className="flex w-[310px] flex-col items-start gap-[16px]">
        <div className="flex w-full flex-col items-center gap-[16px]">
          <h2 id="featured-title" className="w-full px-[20px] text-[24px] leading-[32px] font-bold text-text-accent">
            NFT EM DESTAQUE
          </h2>
          <p className="w-full px-[20px] text-center text-[22px] leading-[16px] font-bold text-foreground">
            OFERTA LIMITADA
          </p>
        </div>
        {featured.data ? (
          <Link
            to="/nft/$id"
            params={{ id: featured.data.id }}
            className="relative block h-[368px] w-full rounded-[22px]"
          >
            <NftImage
              alt={`${featured.data.name}, em destaque`}
              src={featured.data.image}
              sizes="310px"
              width={310}
              height={368}
              loading="lazy"
              className="absolute inset-0 size-full max-w-none rounded-[22px] object-cover"
            />
          </Link>
        ) : (
          <Skeleton className="h-[368px] w-full rounded-[22px]" />
        )}
      </div>
      <span
        aria-hidden
        className="absolute top-[299px] left-[16px] size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20"
      />
      <span
        aria-hidden
        className="absolute top-[343px] left-[248px] size-[45px] rounded-[29px]"
        style={{ backgroundImage: ORB }}
      />
      <span
        aria-hidden
        className="absolute top-[105px] left-[38px] size-[15px] rounded-[29px]"
        style={{ backgroundImage: ORB }}
      />
    </section>
  )
}
