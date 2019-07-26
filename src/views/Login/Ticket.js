import { Just, Nothing } from 'folktale/maybe';
import cn from 'classnames';
import React, { useCallback, useState, useEffect } from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as kg from 'urbit-key-generation/dist/index';
import { Input, Grid, CheckboxInput } from 'indigo-react';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import {
  usePointInput,
  useTicketInput,
  usePassphraseInput,
  useCheckboxInput,
} from 'lib/useInputs';
import * as need from 'lib/need';
import { WALLET_TYPES, urbitWalletFromTicket } from 'lib/wallet';
import useImpliedPoint from 'lib/useImpliedPoint';
import useLoginView from 'lib/useLoginView';
import patp2dec from 'lib/patp2dec';

export default function Ticket({ className }) {
  useLoginView(WALLET_TYPES.TICKET);

  const { contracts } = useNetwork();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const impliedPoint = useImpliedPoint();

  // point
  const [pointInput, { data: pointName }] = usePointInput({
    name: 'point',
    initialValue: impliedPoint || '',
    autoFocus: true,
  });

  // passphrase
  const [passphraseInput, { data: passphrase }] = usePassphraseInput({
    name: 'passphrase',
    label: 'Wallet Passphrase',
  });

  const [hasPassphraseInput, { data: hasPassphrase }] = useCheckboxInput({
    name: 'has-passphrase',
    label: 'Passphrase',
    initialValue: false,
  });

  // ticket
  const [error, setError] = useState();
  const [deriving, setDeriving] = useState(false);
  const [ticketInput, { data: ticket, pass: validTicket }] = useTicketInput({
    name: 'ticket',
    label: 'Master Ticket',
    error,
    deriving,
  });

  // shards
  const [shardsInput, { data: isUsingShards }] = useCheckboxInput({
    name: 'shards',
    label: 'Shards',
    initialValue: false,
  });

  const [shard1Input, { data: shard1, pass: shard1Pass }] = useTicketInput({
    name: 'shard1',
    label: 'Shard 1',
  });

  const [shard2Input, { data: shard2, pass: shard2Pass }] = useTicketInput({
    name: 'shard2',
    label: 'Shard 2',
  });

  const [shard3Input, { data: shard3, pass: shard3Pass }] = useTicketInput({
    name: 'shard3',
    label: 'Shard 3',
  });

  const shardsReady = shard1Pass && shard2Pass && shard3Pass;

  // TODO: maybe want to do this only on-go, because wallet derivation is slow...
  const deriveWalletFromTicket = useCallback(async () => {
    // clear states
    setError();
    setDeriving(true);
    setUrbitWallet(Nothing());

    if (
      !ticket ||
      !pointName ||
      !ob.isValidPatq(ticket) ||
      !ob.isValidPatp(pointName)
    ) {
      setDeriving(false);
      return;
    }

    const _contracts = need.contracts(contracts);
    const point = patp2dec(pointName);
    const urbitWallet = await urbitWalletFromTicket(ticket, point, passphrase);
    const [isOwner, isTransferProxy] = await Promise.all([
      azimuth.azimuth.isOwner(
        _contracts,
        point,
        urbitWallet.ownership.keys.address
      ),
      azimuth.azimuth.isTransferProxy(
        _contracts,
        point,
        urbitWallet.ownership.keys.address
      ),
    ]);

    if (!isOwner && !isTransferProxy) {
      // notify the user, but allow login regardless
      setError(
        'This ticket is not the owner of or transfer proxy for this point.'
      );
    }

    setUrbitWallet(Just(urbitWallet));
    setPointCursor(Just(point));
    setDeriving(false);
  }, [
    pointName,
    ticket,
    passphrase,
    contracts,
    setUrbitWallet,
    setPointCursor,
    setDeriving,
  ]);

  const deriveWalletFromShards = useCallback(async () => {
    const s1 = shard1 || undefined;
    const s2 = shard2 || undefined;
    const s3 = shard3 || undefined;

    try {
      const ticket = kg.combine([s1, s2, s3]);
      const point = patp2dec(pointName);
      const uhdw = await urbitWalletFromTicket(ticket, point, passphrase);
      setUrbitWallet(Just(uhdw));
    } catch (_) {
      // do nothing
    }
  }, [passphrase, pointName, setUrbitWallet, shard1, shard2, shard3]);

  // derive wallet on change
  useEffect(() => {
    if (isUsingShards && shardsReady) {
      deriveWalletFromShards();
    } else if (validTicket) {
      deriveWalletFromTicket();
    }
  }, [
    isUsingShards,
    validTicket,
    shardsReady,
    deriveWalletFromShards,
    deriveWalletFromTicket,
  ]);

  return (
    <Grid className={cn('mt4', className)}>
      <Grid.Item full as={Input} {...pointInput} />

      {!isUsingShards && <Grid.Item full as={Input} {...ticketInput} />}
      {isUsingShards && (
        <>
          <Grid.Item full as={Input} {...shard1Input} />
          <Grid.Item full as={Input} {...shard2Input} />
          <Grid.Item full as={Input} {...shard3Input} />
        </>
      )}
      {hasPassphrase && <Grid.Item full as={Input} {...passphraseInput} />}

      <Grid.Item full as={CheckboxInput} {...hasPassphraseInput} />
      <Grid.Item full as={CheckboxInput} {...shardsInput} />
    </Grid>
  );
}
