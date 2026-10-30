vi.mock('../src/contexts/LanguageContext',()=>({useLanguage:()=>({currentLanguage:'en'})}));
vi.mock('../src/contexts/CartContext',()=>({useCart:()=>({addItem:vi.fn(),openCart:vi.fn(),isAddingItem:()=>false})}));
vi.mock('../src/config/api',()=>({apiClient:{products:{getById:vi.fn()}}}));
import React from 'react';
import { it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../src/components/products/ProductCard';
it('opens Amazon.fr by default even when another marketplace is listed first',()=>{const open=vi.spyOn(window,'open').mockImplementation(()=>null);render(<MemoryRouter><ProductCard product={{id:'p',name:'Valve',sku:'sku',price:5,stock_quantity:0,images:[],amazon_links:{BE:'https://www.amazon.com.be/dp/X',FR:'https://www.amazon.fr/dp/X'}}}/></MemoryRouter>);fireEvent.click(screen.getByText('View on Amazon'));expect(open).toHaveBeenCalledWith('https://www.amazon.fr/dp/X','_blank','noopener,noreferrer');});
