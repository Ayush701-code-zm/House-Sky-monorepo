/**
 * Smooth-scroll to a section by id once it exists in the DOM.
 *
 * Retries briefly because results are often rendered a moment after the
 * action that triggered the scroll (route change, Suspense, data fetch).
 * The fixed navbar offset comes from `scroll-padding-top` on <html>.
 * Pass `blur: true` after a search submit so the mobile keyboard closes
 * first — otherwise the viewport resize fights the scroll.
 */
export function scrollToSection(id: string, { delay = 120, blur = false }: { delay?: number; blur?: boolean } = {}) {
  if (typeof window === 'undefined') return
  if (blur && document.activeElement instanceof HTMLElement) document.activeElement.blur()

  let attempts = 0
  const run = () => {
    const el = document.getElementById(id)
    if (!el) {
      if (attempts++ < 20) setTimeout(run, 100)
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  setTimeout(run, delay)
}

const FORM_ISSUE_SELECTOR = [
  '.hs-input-error',
  '[aria-invalid="true"]',
  ':invalid',
  '.hs-field-error',
  '.hs-error-message',
].join(', ')

function isFocusableField(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  )
}

/** Scroll (and preferably focus) the first invalid / error field in a form or page. */
export function scrollToFormField(el: Element | null | undefined) {
  if (typeof window === 'undefined' || !el) return

  let target: HTMLElement =
    el instanceof HTMLElement ? el : ((el as Element).parentElement as HTMLElement)

  // Error text nodes → prefer the related control above them
  if (target.classList?.contains('hs-field-error') || target.classList?.contains('hs-error-message')) {
    const container = target.closest('div, fieldset, form, section') || target.parentElement
    const field =
      container?.querySelector<HTMLElement>('input, select, textarea, [role="checkbox"], button') ||
      target.previousElementSibling
    if (field instanceof HTMLElement) target = field
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' })

  if (isFocusableField(target) && !target.hasAttribute('disabled')) {
    try {
      target.focus({ preventScroll: true })
    } catch {
      target.focus()
    }
  }
}

/** Find the first marked/invalid control inside `root` (form or document) and scroll to it. */
export function scrollToFirstFormIssue(root: ParentNode | null | undefined = typeof document !== 'undefined' ? document : null) {
  if (!root) return false
  const issue = root.querySelector(FORM_ISSUE_SELECTOR)
  if (!issue) return false
  scrollToFormField(issue)
  return true
}

/**
 * HTML5 constraint check for a form. On failure: block submit, scroll to the
 * first bad field, and show the browser validation message.
 */
export function ensureFormValidity(form: HTMLFormElement): boolean {
  if (form.checkValidity()) return true
  const firstInvalid = form.querySelector(':invalid')
  if (firstInvalid instanceof HTMLElement) {
    firstInvalid.classList.add('hs-input-error')
    scrollToFormField(firstInvalid)
    if (
      firstInvalid instanceof HTMLInputElement ||
      firstInvalid instanceof HTMLSelectElement ||
      firstInvalid instanceof HTMLTextAreaElement
    ) {
      firstInvalid.reportValidity()
    } else {
      form.reportValidity()
    }
  } else {
    form.reportValidity()
  }
  return false
}
