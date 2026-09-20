import {
  SorobanAdapter,
  DEFAULT_STELLAR_CONFIG,
  type BuildRegisterLotTxParams,
} from '../src/core/blockchain/SorobanAdapter';
import {
  Keypair,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';

/**
 * Asserts condition validity, throwing an error with descriptive context upon failure.
 *
 * @param condition - Boolean condition expression under test.
 * @param message - Diagnostic message displayed on assertion failure.
 */
function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Executes end-to-end verification of SorobanAdapter type serialization,
 * pre-flight simulation, live testnet submission, and envelope parsing.
 */
async function runSorobanVerificationSuite(): Promise<void> {
  console.log('=== STARTING SOROBAN ADAPTER VERIFICATION SUITE ===\n');

  const adapter = new SorobanAdapter(DEFAULT_STELLAR_CONFIG);
  const server = adapter.getServer();
  const testKeypair = Keypair.random();
  const producerPublicKey = testKeypair.publicKey();

  console.log(`[1/5] Testing domain parameter serialization into XDR types...`);
  const rawDigestHex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const lotParams: BuildRegisterLotTxParams = {
    lotCode: 'MIXTECA_LOT_42',
    digest: rawDigestHex,
    producerId: producerPublicKey,
    altitude: 1750,
    sourceAccount: producerPublicKey,
    contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  };

  const registrationTx = adapter.buildRegisterLotTransaction(lotParams);
  assertCondition(registrationTx.operations.length === 1, 'Transaction must have exactly one operation');

  const firstOperation = registrationTx.operations[0];
  assertCondition(
    firstOperation.type === 'invokeHostFunction',
    'Operation type must be invokeHostFunction'
  );

  const hostFunctionOp = firstOperation as any;
  const invokeArgs = hostFunctionOp.func.invokeContract.args;

  assertCondition(invokeArgs.length === 4, 'Invocation must contain 4 mapped arguments');

  const [lotCodeScVal, digestScVal, producerScVal, altitudeScVal] = invokeArgs;
  assertCondition(lotCodeScVal.type === 'scvSymbol', 'lot_code must map to Symbol');
  assertCondition(digestScVal.type === 'scvBytes', 'digest must map to BytesN<32>');
  assertCondition(producerScVal.type === 'scvAddress', 'producer_id must map to Address');
  assertCondition(altitudeScVal.type === 'scvU32', 'altitude must map to u32');

  const digestLength = digestScVal.bytes.value ? digestScVal.bytes.value.length : digestScVal.bytes.length;
  console.log('  -> lot_code mapped to Symbol:', lotCodeScVal.sym.toString());
  console.log('  -> digest mapped to Bytes (32 bytes): length =', digestLength);
  console.log('  -> producer_id mapped to Address');
  console.log('  -> altitude mapped to u32:', altitudeScVal.u32);
  console.log('  [PASS] Domain parameter mapping validated.\n');

  console.log('[2/5] Requesting testnet funding via Friendbot...');
  const fundingSuccess = await adapter.fundTestnetAccount(producerPublicKey);
  assertCondition(fundingSuccess, 'Friendbot funding must succeed');
  console.log(`  -> Account ${producerPublicKey} successfully funded.\n`);

  console.log('[3/5] Executing pre-flight simulation against Soroban RPC...');
  const fundedAccount = await server.getAccount(producerPublicKey);
  const liveContract = new Contract('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
  const simCallOp = liveContract.call('decimals');

  const simTx = new TransactionBuilder(fundedAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(simCallOp)
    .setTimeout(30)
    .build();

  const simulationResult = await adapter.simulateTransaction(simTx);
  assertCondition(simulationResult.success, 'Pre-flight simulation must succeed');
  assertCondition(
    simulationResult.footprint.cpuInstructions > 0,
    'Estimated CPU instructions must be greater than zero'
  );
  console.log('  -> Simulation status: SUCCESS');
  console.log('  -> CPU Instructions:', simulationResult.footprint.cpuInstructions);
  console.log('  -> Minimum Resource Fee:', simulationResult.minResourceFee);
  console.log('  -> Read-only footprint count:', simulationResult.footprint.readOnlyLedgerKeys.length);
  console.log('  -> Read-write footprint count:', simulationResult.footprint.readWriteLedgerKeys.length);
  console.log('  [PASS] Pre-flight simulation footprint parsed.\n');

  console.log('[4/5] Submitting live transaction to Soroban Testnet...');
  const assembledTx = rpc.assembleTransaction(simTx, simulationResult.rawResponse as any).build();
  assembledTx.sign(testKeypair);

  const envelopeResult = await adapter.submitTransaction(assembledTx, true);
  assertCondition(envelopeResult.status === 'success', 'Live transaction status must be success');
  assertCondition(envelopeResult.ledgerNumber > 0, 'Ledger number must be greater than zero');
  assertCondition(envelopeResult.txHash.length === 64, 'Transaction hash must be 64 characters');
  assertCondition(
    envelopeResult.explorerUrl.includes('stellar.expert/explorer/testnet/tx/'),
    'Explorer URL must target Stellar Expert testnet'
  );

  console.log('  -> Transaction Status:', envelopeResult.status.toUpperCase());
  console.log('  -> Confirmed Ledger Sequence:', envelopeResult.ledgerNumber);
  console.log('  -> Transaction Hash:', envelopeResult.txHash);
  console.log('  -> Stellar Expert Explorer URL:', envelopeResult.explorerUrl);
  console.log('  [PASS] Live Soroban Testnet transaction confirmed.\n');

  console.log('[5/5] Validating UI responsiveness and latency resilience...');
  const startTime = Date.now();
  const uiResult = await adapter.registerLotOnChain({
    lotCode: 'COFFEE_SAMPLE_A',
    producerId: producerPublicKey,
    digestHash: rawDigestHex,
    altitudeMeters: 1680,
  });
  const durationMs = Date.now() - startTime;

  assertCondition(Boolean(uiResult.txHash), 'Result must contain a valid transaction hash');
  assertCondition(Boolean(uiResult.explorerUrl), 'Result must contain an explorer URL');
  assertCondition(durationMs < 6000, 'UI call must resolve within timeout bound');
  console.log(`  -> Non-blocking execution completed in ${durationMs}ms`);
  console.log('  -> Result hash:', uiResult.txHash);
  console.log('  -> Explorer URL:', uiResult.explorerUrl);
  console.log('  [PASS] UI responsiveness verified.\n');

  console.log('====================================================');
  console.log('ALL SOROBAN ADAPTER CHECKS PASSED WITH FULL ACCREDITATION');
  console.log('====================================================');
}

runSorobanVerificationSuite().catch((error) => {
  console.error('Soroban verification suite failed:', error);
  process.exit(1);
});
