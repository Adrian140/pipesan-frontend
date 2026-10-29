import React from 'react';
import { it,expect,vi } from 'vitest';
import { render,screen } from '@testing-library/react';
const mocked=vi.hoisted(()=>({invoices:vi.fn()}));
vi.mock('../src/config/api',()=>({apiClient:{invoices:{getAll:mocked.invoices}}}));
import InvoicesList from '../src/components/dashboard/InvoicesList';
it('renders real numeric invoice values without crashing',async()=>{mocked.invoices.mockResolvedValue([{id:'invoice',number:'INV-001',amount:19.5,vatAmount:3.25,date:'2026-10-29',status:'pending'}]);render(<InvoicesList/>);expect(await screen.findByText('Factura #INV-001')).toBeTruthy();expect(screen.getByText('€19.50')).toBeTruthy();});
it('shows an invoice load failure instead of silently showing an empty account',async()=>{mocked.invoices.mockRejectedValue(new Error('Access denied'));render(<InvoicesList/>);expect((await screen.findByRole('alert')).textContent).toContain('Access denied');});
