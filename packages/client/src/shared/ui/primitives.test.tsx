import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values so conditional classes read cleanly', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('lets a later class win over a conflicting earlier one', () => {
    // This is the whole reason for tailwind-merge: a caller's override must beat
    // the component's default rather than both landing in the class list.
    expect(cn('p-6 pt-0', 'p-3')).toBe('p-3');
  });
});

describe('Button', () => {
  it('renders a button and forwards its click handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Retry</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('defaults to the primary variant and switches on request', () => {
    const { rerender } = render(<Button>Go</Button>);
    expect(screen.getByRole('button').className).toContain('bg-primary');

    rerender(<Button variant="outline">Go</Button>);
    expect(screen.getByRole('button').className).toContain('border-input');
  });

  it('lets a caller override variant classes', () => {
    render(
      <Button variant="outline" className="border-destructive/40">
        Retry
      </Button>
    );

    const className = screen.getByRole('button').className;
    expect(className).toContain('border-destructive/40');
    expect(className).not.toContain('border-input');
  });

  it('respects disabled', () => {
    render(<Button disabled>Previous</Button>);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });
});

describe('Input', () => {
  it('is a controlled input that reports every change', () => {
    const onChange = vi.fn();
    render(<Input type="search" aria-label="Search products" value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), {
      target: { value: 'mascara' },
    });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('forwards aria-label so the search box keeps a distinct accessible name', () => {
    render(<Input type="search" aria-label="Search all products" />);

    expect(screen.getByRole('searchbox', { name: 'Search all products' })).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('carries the variant and merges caller classes', () => {
    render(
      <Badge variant="secondary" data-testid="b" className="bg-green-100">
        -7%
      </Badge>
    );

    expect(screen.getByTestId('b')).toHaveClass('bg-green-100');
    expect(screen.getByTestId('b')).toHaveTextContent('-7%');
  });
});

describe('Skeleton', () => {
  it('renders a pulsing placeholder that merges caller sizing', () => {
    render(<Skeleton data-testid="s" className="h-4 w-1/2" />);

    expect(screen.getByTestId('s').className).toContain('animate-pulse');
    expect(screen.getByTestId('s').className).toContain('h-4');
  });
});
