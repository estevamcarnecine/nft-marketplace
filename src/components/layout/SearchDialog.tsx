import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import searchIcon from '@/assets/header/search.svg'

export function SearchDialog() {
  const navigate = useNavigate()
  const current = useSearch({ strict: false })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setQuery(typeof current.q === 'string' ? current.q : '')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = query.trim()
    setOpen(false)
    void navigate({ to: '/', search: q ? { q } : {}, hash: 'mercado' })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Buscar NFTs" className="relative h-[20px] w-[20.001px] cursor-pointer">
          <img alt="" src={searchIcon} className="absolute inset-0 block size-full max-w-none" />
        </button>
      </DialogTrigger>
      <DialogContent className="top-[120px] w-[560px] max-w-[calc(100vw-32px)] translate-y-0 gap-[16px] rounded-[6px] border-border bg-surface-card p-[24px] sm:max-w-[560px]">
        <DialogTitle className="text-[17px] leading-[16px] font-bold text-foreground">Buscar NFTs</DialogTitle>
        <DialogDescription className="text-[14px] leading-[20px] text-text-secondary">
          Busque por nome, número do token ou criador.
        </DialogDescription>
        <form role="search" onSubmit={submit} className="flex items-center gap-[8px]">
          <label htmlFor="catalog-search" className="sr-only">
            Termo de busca
          </label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Emerald Ape, #0042, Nova Sato"
            autoComplete="off"
            className="h-[40px] min-w-px flex-1 rounded-[3px] border border-border bg-transparent px-[12px] text-[14px] leading-[16px] text-foreground outline-none placeholder:text-secondary focus:border-primary"
          />
          <button
            type="submit"
            className="flex h-[40px] items-center rounded-[3px] bg-primary px-[20px] text-[14px] leading-[16px] font-bold text-ink"
          >
            Buscar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
