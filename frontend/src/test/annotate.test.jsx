import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import Adjudicate from '../pages/Adjudicate'
import Annotate from '../pages/Annotate'
import { mockFetch } from './fixtures'

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)
const item = (id, text) => ({ item: { id, text, script: 'roman_nepali', code_mixed: true }, done: 0, total: 2 })

beforeEach(() => { try { localStorage.clear() } catch {  } })

describe('Annotate', () => {
  it('asks for a pseudonymous ID and rejects names with spaces', async () => {
    inRouter(<Annotate />)
    const input = screen.getByPlaceholderText('A1')
    await userEvent.type(input, 'Ram Bahadur')
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, 'S1 ')                      
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
  })

  it('labels with a click or a keyboard shortcut, sends flags, then loads the next item', async () => {
    localStorage.setItem('nepnlp-annotator', 'A1')
    const queue = [item('i1', 'k xa khabar'), item('i2', 'service dhilo thiyo'), { item: null, done: 2, total: 2 }]
    const spy = mockFetch({
      '/annotation/next': () => queue.shift(),
      '/annotation/labels': (url, opts) => ({ annotator_id: 'A1', label: JSON.parse(opts.body).label }),
    })
    inRouter(<Annotate />)
    expect(await screen.findByText('k xa khabar')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Sarcasm / irony'))
    await userEvent.click(screen.getByRole('button', { name: /तटस्थ/ }))
    expect(await screen.findByText('service dhilo thiyo')).toBeInTheDocument()
    await userEvent.keyboard('2')
    expect(await screen.findByTestId('annot-done')).toBeInTheDocument()

    const labelCalls = spy.mock.calls.filter(([u]) => String(u).includes('/annotation/labels')).map(([, o]) => JSON.parse(o.body))
    expect(labelCalls).toEqual([
      { item_id: 'i1', annotator_id: 'A1', label: 'तटस्थ', flags: ['sarcasm'], note: null },
      { item_id: 'i2', annotator_id: 'A1', label: 'नकारात्मक', flags: [], note: null },
    ])
  })

  it('keyboard shortcuts still work after ticking a flag (regression: focused checkbox swallowed keys)', async () => {
    localStorage.setItem('nepnlp-annotator', 'A1')
    const queue = [item('i1', 'k xa khabar'), { item: null, done: 1, total: 1 }]
    const spy = mockFetch({ '/annotation/next': () => queue.shift(), '/annotation/labels': { label: 'x' } })
    inRouter(<Annotate />)
    await screen.findByText('k xa khabar')
    await userEvent.click(screen.getByLabelText('Mixed sentiment'))   
    await userEvent.keyboard('1')
    expect(await screen.findByTestId('annot-done')).toBeInTheDocument()
    const body = JSON.parse(spy.mock.calls.find(([u]) => String(u).includes('/labels'))[1].body)
    expect(body).toMatchObject({ item_id: 'i1', label: 'सकारात्मक', flags: ['mixed'] })
  })

  it('explains when annotation is disabled on the server', async () => {
    localStorage.setItem('nepnlp-annotator', 'A1')
    mockFetch({ '/annotation/next': { status: 404, body: { message: 'No such endpoint' } } })
    inRouter(<Annotate />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/not enabled on this server/)
  })
})

describe('Adjudicate', () => {
  it('does not reuse the annotator ID and warns on self-adjudication', async () => {
    localStorage.setItem('nepnlp-annotator', 'A1')
    mockFetch({
      '/annotation/disagreements': [{ item: { id: 'i9', text: 'thik cha' },
        labels: [{ annotator_id: 'A1', label: 'सकारात्मक', flags: [] }, { annotator_id: 'A2', label: 'तटस्थ', flags: [] }] }],
      '/annotation/progress': { items: 1, labels_by_annotator: {}, items_with_two_or_more_labels: 1, disagreements: 1, adjudicated: 0, labels: [] },
    })
    inRouter(<Adjudicate />)
    const input = await screen.findByPlaceholderText('ADJ')
    expect(input).toHaveValue('')                                   
    await userEvent.type(input, 'A1')
    expect(await screen.findByText(/You labelled this item yourself/)).toBeInTheDocument()
  })

  it('shows both labels side by side and removes the item once decided', async () => {
    localStorage.setItem('nepnlp-adjudicator', 'ADJ')
    const spy = mockFetch({
      '/annotation/disagreements': [{ item: { id: 'i9', text: 'thik thikai cha' },
        labels: [{ annotator_id: 'A1', label: 'सकारात्मक', flags: ['mixed'], note: null },
                 { annotator_id: 'A2', label: 'तटस्थ', flags: [], note: 'unclear' }] }],
      '/annotation/progress': { items: 5, labels_by_annotator: { A1: 5, A2: 5 }, items_with_two_or_more_labels: 5, disagreements: 1, adjudicated: 0, labels: [] },
      '/annotation/adjudications': { item_id: 'i9', label: 'तटस्थ' },
    })
    inRouter(<Adjudicate />)
    const card = await screen.findByTestId('disagreement')
    expect(within(card).getByText(/Mixed sentiment/)).toBeInTheDocument()
    expect(within(card).getByText(/unclear/)).toBeInTheDocument()
    expect(screen.getByTestId('annot-progress')).toHaveTextContent('1 open disagreements')
    await userEvent.click(within(card).getByRole('button', { name: /तटस्थ/ }))
    await waitFor(() => expect(screen.queryByTestId('disagreement')).not.toBeInTheDocument())
    const body = JSON.parse(spy.mock.calls.find(([u]) => String(u).includes('adjudications'))[1].body)
    expect(body).toEqual({ item_id: 'i9', adjudicator_id: 'ADJ', label: 'तटस्थ', note: null })
  })
})
