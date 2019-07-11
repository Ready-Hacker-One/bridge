import React from 'react';
import cn from 'classnames';
import { Flex } from 'indigo-react';

import Footer from './Footer';
import useBreakpoints from 'lib/useBreakpoints';

// View is a top-level component that all Views must render to inherit styling
function View({ className, children, inset = false, full = false, ...rest }) {
  const isMobile = useBreakpoints([true, false, false]);
  const shouldInset = inset && !isMobile;

  return (
    <Flex
      col
      justify="between"
      className={cn(
        'minh-100 ph5',
        {
          mw1: !full,
          'mw2 ph9-md ph10-lg': full,
        },
        className
      )}
      {...rest}>
      <Flex.Item
        className={cn('pb5', {
          pt10: shouldInset,
          pt5: !shouldInset,
        })}>
        {children}
      </Flex.Item>
      <Footer.Target />
    </Flex>
  );
}

// View.Full is sugar for <View full /> to help with readability
View.Full = function FullView(props) {
  return <View full {...props} />;
};

export default View;
