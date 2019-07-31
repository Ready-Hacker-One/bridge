import React, { useCallback } from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { ErrorText } from './Typography';
import { useField } from 'react-final-form';

export default function Input({
  // visuals
  type,
  name,
  label,
  className,
  accessory,
  disabled = false,
  mono = false,

  // callbacks
  onEnter,

  // state
  config,

  // extra
  ...rest
}) {
  const {
    input,
    meta: {
      active,
      data,
      dirty,
      error,
      modified,
      pristine,
      submitError,
      submitFailed,
      submitSucceeded,
      submitting,
      touched,
      valid,
      validating,
      visited,
    },
  } = useField(name, config);

  disabled = disabled || submitting;

  // notify parent of enter keypress iff not disabled and passing
  const onKeyPress = useCallback(
    e => !disabled && valid && e.key === 'Enter' && onEnter && onEnter(),
    [disabled, valid] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <Flex
      col
      className={cn(className, 'mb1')}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}>
      <Flex.Item
        as="label"
        className={cn('f6 lh-tall', {
          black: !disabled,
          gray4: disabled,
        })}
        htmlFor={name}>
        {label}
      </Flex.Item>
      <Flex.Item as={Flex} row className="rel">
        <Flex.Item
          flex
          as={type === 'textarea' ? 'textarea' : 'input'}
          type={type === 'textarea' ? undefined : type}
          {...rest}
          // NOTE: 24px = 12px * 2 (from p3 styling)
          style={type === 'textarea' ? { minHeight: 'calc(1rem + 24px)' } : {}}
          className={cn(
            'b b1 p3 outline-none',
            { mono },
            {
              'bg-white': !disabled,
              'bg-gray1': disabled,
            },
            {
              gray4: !(active || touched),
              black: active || touched,
            },
            {
              'b-green3': valid,
              'b-black': !valid && active,
              'b-yellow3': !valid && !active && touched && error,
              'b-gray2': !valid && !active && !touched && !error,
            }
          )}
          id={name}
          name={name}
          onKeyPress={onKeyPress}
          {...input}
        />
        {accessory && (
          <div
            className="abs"
            style={{
              top: 0,
              right: 0,
              height: '100%',
              width: '44px',
              overflow: 'hidden',
            }}>
            {accessory}
          </div>
        )}
      </Flex.Item>
      {touched && error && (
        <Flex.Item as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
}
