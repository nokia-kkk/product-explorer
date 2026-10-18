import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Picks an option from a shadcn (Radix) Select. Unlike a native `<select>`, the
 * trigger is a button and the options only exist once the popup is open, so this
 * has to be a real click sequence rather than a `fireEvent.change`.
 *
 * @param triggerName Accessible name of the combobox, e.g. 'Sort products'.
 * @param optionName Visible label of the option, e.g. 'Price low-high'.
 */
export async function selectOption(
  triggerName: string | RegExp,
  optionName: string | RegExp
): Promise<void> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: triggerName }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}
