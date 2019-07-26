import React from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';

export default function Tabs({
  views,
  options,
  currentTab,
  onTabChange,
  className,
  ...rest
}) {
  const Tab = views[currentTab];

  return (
    <Grid className={className}>
      <Grid.Item full as={Flex} wrap className="b-gray3 bb1">
        {options.map((option, i) => {
          const isActive = option.value === currentTab;
          const isFirst = i === 0;

          return (
            <Flex.Item
              key={option.value}
              onClick={() => onTabChange(option.value)}
              className={cn(
                'f5 pv3 clickable',
                {
                  'black b-black bb1': isActive,
                  gray3: !isActive,
                },
                {
                  // all items have right margin/padding
                  'mr2 pr2': true,
                  // the first one is flush to the left
                  'ml2 pl2': !isFirst,
                }
              )}
              style={{ marginBottom: '-1px' }}>
              {option.text}
            </Flex.Item>
          );
        })}
      </Grid.Item>
      <Grid.Item full as={Tab} {...rest} />
    </Grid>
  );
}
