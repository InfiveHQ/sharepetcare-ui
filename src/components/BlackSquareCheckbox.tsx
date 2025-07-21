import React from "react";

interface BlackSquareCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const BlackSquareCheckbox: React.FC<BlackSquareCheckboxProps> = ({ checked, onChange, disabled, ariaLabel }) => (
  <label className="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className="appearance-none w-5 h-5 border-2 border-gray-400 rounded-none bg-white checked:bg-black checked:border-black focus:ring-2 focus:ring-black transition-all duration-100 disabled:opacity-50"
    />
    <span
      className={
        `absolute w-3 h-3 bg-black rounded-none pointer-events-none transition-opacity duration-100 ` +
        (checked ? 'opacity-100' : 'opacity-0')
      }
      style={{ marginLeft: 2 }}
    />
  </label>
);

export default BlackSquareCheckbox; 