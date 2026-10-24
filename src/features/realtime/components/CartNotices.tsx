import { dismissCartNotice, useCartNotices } from '../notices'

export function CartNotices() {
  const notices = useCartNotices()

  return (
    <div role="status" aria-live="polite" className="flex w-full flex-col gap-[8px] empty:absolute">
      {notices.map((notice) => (
        <p
          key={notice.id}
          className="flex w-full items-center justify-between gap-[16px] rounded-[3px] border border-primary bg-surface-dark p-[12px] text-[14px] leading-[20px] text-text-accent"
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => dismissCartNotice(notice.id)}
            className="shrink-0 font-bold text-foreground underline"
          >
            Entendi
          </button>
        </p>
      ))}
    </div>
  )
}
