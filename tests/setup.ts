import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

if (typeof document !== 'undefined' && typeof Range !== 'undefined') {
  const emptyClientRects = document
    .createElement('div')
    .getClientRects()

  Range.prototype.getClientRects = () => emptyClientRects
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  document.elementFromPoint = () => null
}

afterEach(() => {
  cleanup()
})
