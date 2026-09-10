'use client'

import React, { useEffect, useRef, useState } from 'react'
import content from './generated/content.json' with { type: 'json' }
import { Button, Field, IconButton, Type } from './design-system/index.jsx'
import { COUNTRIES, validatePreOrderForm } from './preOrderForm.js'

const EMPTY_VALUES = Object.freeze({ firstName: '', lastName: '', email: '', country: '' })
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
}

export function PreOrderModal({ open, onRequestClose, backgroundImage, returnFocusRef }) {
  const [rendered, setRendered] = useState(open)
  const [phase, setPhase] = useState(open ? 'open' : 'closed')
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const dialogRef = useRef(null)
  const closeHandlerRef = useRef(onRequestClose)

  useEffect(() => { closeHandlerRef.current = onRequestClose }, [onRequestClose])

  useEffect(() => {
    let frame = 0
    let timer = 0

    if (open) {
      setRendered(true)
      setPhase('opening')
      frame = window.requestAnimationFrame(() => setPhase('open'))
    } else if (rendered) {
      setPhase('closing')
      timer = window.setTimeout(() => setRendered(false), 300)
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      if (timer) window.clearTimeout(timer)
    }
  }, [open, rendered])

  useEffect(() => {
    if (!rendered || typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    const backgroundElements = Array.from(document.querySelectorAll('.site-shell > :not(.preorder-modal-overlay)'))
    const previousInert = backgroundElements.map((element) => element.inert)
    document.body.style.overflow = 'hidden'
    backgroundElements.forEach((element) => { element.inert = true })

    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.querySelector('#firstName')?.focus())
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeHandlerRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])
        .filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      backgroundElements.forEach((element, index) => { element.inert = previousInert[index] })
      window.requestAnimationFrame(() => returnFocusRef?.current?.focus())
    }
  }, [rendered, returnFocusRef])

  if (!rendered) return null

  const updateValue = (event) => {
    const { name, value } = event.currentTarget
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validatePreOrderForm(values)
    setErrors(nextErrors)
    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) window.requestAnimationFrame(() => dialogRef.current?.querySelector(`#${firstInvalidField}`)?.focus())
  }

  return (
    <div
      className="preorder-modal-overlay"
      data-modal-state={phase}
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeHandlerRef.current?.() }}
    >
      <section
        className="preorder-modal"
        data-ds-theme="inverse"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preorder-modal-title"
        aria-describedby="preorder-modal-description"
      >
        <IconButton className="preorder-modal__close" label={content.preOrderModal.closeButtonLabel} variant="plain" size="small" icon={<CloseIcon />} onClick={() => closeHandlerRef.current?.()} />
        <div className="preorder-modal__form-pane">
          <header className="preorder-modal__intro">
            <Type as="h2" role="h1" id="preorder-modal-title">{content.preOrderModal.title.split('\n').map((line) => <span key={line}>{line}</span>)}</Type>
            <Type role="body-large" id="preorder-modal-description">{content.preOrderModal.description.split('\n').map((line) => <span key={line}>{line}</span>)}</Type>
          </header>
          <form className="preorder-modal__form" noValidate onSubmit={submit}>
            <div className="preorder-modal__name-row">
              <Field id="firstName" name="firstName" label={content.preOrderModal.fields.firstName.label} type="text" autoComplete="given-name" required value={values.firstName} error={errors.firstName} onChange={updateValue} />
              <Field id="lastName" name="lastName" label={content.preOrderModal.fields.lastName.label} type="text" autoComplete="family-name" required value={values.lastName} error={errors.lastName} onChange={updateValue} />
            </div>
            <Field id="email" name="email" label={content.preOrderModal.fields.email.label} type="email" autoComplete="email" required value={values.email} error={errors.email} onChange={updateValue} />
            <Field id="country" name="country" label={content.preOrderModal.fields.country.label} placeholder={content.preOrderModal.fields.country.placeholder} autoComplete="country" required value={values.country} error={errors.country} options={COUNTRIES} onChange={updateValue} />
            <Button type="submit" variant="primary-borderless" size="large">{content.cta.reserveMogo}</Button>
          </form>
        </div>
        <div className="preorder-modal__media" aria-hidden="true"><img src={backgroundImage.src} srcSet={backgroundImage.srcSet} sizes={backgroundImage.sizes} width={backgroundImage.width} height={backgroundImage.height} alt="" decoding="async" /></div>
      </section>
    </div>
  )
}
