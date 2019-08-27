import React from 'react';
import cn from 'classnames';
import { ReactComponent as Copy } from 'assets/copy.svg';

import useCopiable from 'lib/useCopiable';
import WithTooltip from 'components/WithTooltip';

export default function CopiableWithTooltip({
  as: As = 'span',
  text,
  children,
  className,
  ...rest
}) {
  const [doCopy, didCopy] = useCopiable(text || children);

  return (
    <As className={cn(className, 'nowrap')} {...rest}>
      {children}
      <WithTooltip content={didCopy ? 'Copied!' : 'Copy'}>
        <Copy
          style={{ height: '1em', width: '1em' }}
          className="ml1 pointer"
          onClick={doCopy}
        />
      </WithTooltip>
    </As>
  );
}
