vi.mock('../src/config/api',()=>({apiClient:{shippingRates:{getAll:async()=>[
  {id:1,country_code:'FR',country_name:'France',weight_min_grams:0,weight_max_grams:500,shipping_cost:8.44,currency:'EUR'},
  {id:2,country_code:'FR',country_name:'France',weight_min_grams:500,weight_max_grams:1000,shipping_cost:8.83,currency:'EUR'},
  {id:3,country_code:'AT',country_name:'Austria',weight_min_grams:0,weight_max_grams:1000,shipping_cost:10.15,currency:'EUR'},
]}}}));
import React from 'react';
import { it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import WeightBasedShippingTab from '../src/components/admin/tabs/WeightBasedShippingTab';

it('lists every country collapsed and opens its rates on click', async () => {
  render(<WeightBasedShippingTab/>);
  const france = await screen.findByRole('button',{name:/France.*2 intervale.*de la 8\.44/});
  expect(screen.getByRole('button',{name:/Austria/})).toBeTruthy();
  expect(screen.getByRole('button',{name:/Germany/})).toBeTruthy();
  expect(screen.queryByText('8.83 EUR')).toBeNull();
  fireEvent.click(france);
  expect(screen.getByText('8.83 EUR')).toBeTruthy();
  expect(screen.queryByText('10.15 EUR')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/Austria/}));
  expect(screen.getByText('10.15 EUR')).toBeTruthy();
  expect(screen.queryByText('8.83 EUR')).toBeNull();
});
