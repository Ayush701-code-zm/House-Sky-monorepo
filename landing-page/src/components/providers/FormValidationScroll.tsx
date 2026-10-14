'use client'

import * as React from 'react'
import { ensureFormValidity, scrollToFirstFormIssue, scrollToFormField } from '@/utils/scroll'

/**
 * Site-wide: when a form submit fails validation, scroll to the first problem field.
 *
 * - Capture-phase submit: HTML5 required/type checks (works with `noValidate` forms)
 * - `invalid` event: native constraint failures
 * - Deferred after submit: custom `.hs-input-error` / `.hs-field-error` from React state
 */
export function FormValidationScroll() {
  React.useEffect(() => {
    const onInvalid = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.closest('form')) return
      target.classList.add('hs-input-error')
      scrollToFormField(target)
    }

    const onSubmitCapture = (event: Event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.hasAttribute('data-skip-auto-scroll-validation')) return
      if (!ensureFormValidity(form)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    const onSubmitBubble = (event: Event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.hasAttribute('data-skip-auto-scroll-validation')) return

      // Wait for React setState (custom fieldErrors) to paint, then scroll.
      window.setTimeout(() => {
        scrollToFirstFormIssue(form)
      }, 80)
    }

    const onInput = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.classList.contains('hs-input-error')) return
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (target.checkValidity()) target.classList.remove('hs-input-error')
      }
    }

    document.addEventListener('invalid', onInvalid, true)
    document.addEventListener('submit', onSubmitCapture, true)
    document.addEventListener('submit', onSubmitBubble, false)
    document.addEventListener('input', onInput, true)
    document.addEventListener('change', onInput, true)

    return () => {
      document.removeEventListener('invalid', onInvalid, true)
      document.removeEventListener('submit', onSubmitCapture, true)
      document.removeEventListener('submit', onSubmitBubble, false)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('change', onInput, true)
    }
  }, [])

  return null
}
