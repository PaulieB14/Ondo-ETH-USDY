import { 
  RangeSet as RangeSetEvent,
  RangeOverriden as RangeOverridenEvent 
} from "../generated/RedemptionPriceOracle/Oracle";
import { 
  RangeSet, 
  RangeOverriden, 
  PriceUpdate, 
  ProtocolMetrics,
  DailyProtocolStats 
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts"

function updateProtocolMetricsWithPrice(price: BigInt, timestamp: BigInt): void {
  let metrics = ProtocolMetrics.load("protocol")
  if (metrics == null) {
    metrics = new ProtocolMetrics("protocol")
    metrics.totalSupplyUSDY = BigInt.fromI32(0)
    metrics.totalSupplyRUSDY = BigInt.fromI32(0)
    metrics.totalUsers = BigInt.fromI32(0)
    metrics.totalMints = BigInt.fromI32(0)
    metrics.totalRedemptions = BigInt.fromI32(0)
    metrics.totalVolumeUSD = BigInt.fromI32(0)
    metrics.currentPrice = BigInt.fromI32(0)
    metrics.lastUpdated = BigInt.fromI32(0)
  }
  metrics.currentPrice = price
  metrics.lastUpdated = timestamp
  metrics.save()
}

function updateDailyStatsWithPrice(timestamp: BigInt, price: BigInt): void {
  let dayId = timestamp.div(BigInt.fromI32(86400))
  let dailyStats = DailyProtocolStats.load(dayId.toString())
  
  if (dailyStats == null) {
    dailyStats = new DailyProtocolStats(dayId.toString())
    dailyStats.date = dayId.times(BigInt.fromI32(86400))
    dailyStats.totalSupplyUSDY = BigInt.fromI32(0)
    dailyStats.totalSupplyRUSDY = BigInt.fromI32(0)
    dailyStats.totalMints = BigInt.fromI32(0)
    dailyStats.totalRedemptions = BigInt.fromI32(0)
    dailyStats.volumeUSD = BigInt.fromI32(0)
    dailyStats.averagePrice = BigInt.fromI32(0)
    dailyStats.uniqueUsers = BigInt.fromI32(0)
    dailyStats.newUsers = BigInt.fromI32(0)
  }
  
  dailyStats.averagePrice = price
  dailyStats.save()
}

export function handleRangeSet(event: RangeSetEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new RangeSet(id);
  entity.index = event.params.index;
  entity.start = event.params.start;
  entity.end = event.params.end;
  entity.dailyInterestRate = event.params.dailyInterestRate;
  entity.prevRangeClosePrice = event.params.prevRangeClosePrice;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
  
  // Create a price update based on the range close price
  let priceUpdate = new PriceUpdate(id + "-price");
  priceUpdate.price = event.params.prevRangeClosePrice;
  priceUpdate.timestamp = event.block.timestamp;
  priceUpdate.priceId = event.params.index;
  priceUpdate.blockNumber = event.block.number;
  priceUpdate.transactionHash = event.transaction.hash;
  priceUpdate.save();
  
  // Update protocol metrics
  updateProtocolMetricsWithPrice(event.params.prevRangeClosePrice, event.block.timestamp);
  updateDailyStatsWithPrice(event.block.timestamp, event.params.prevRangeClosePrice);
}

export function handleRangeOverriden(event: RangeOverridenEvent): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new RangeOverriden(id);
  entity.index = event.params.index;
  entity.newStart = event.params.newStart;
  entity.newEnd = event.params.newEnd;
  entity.newDailyInterestRate = event.params.newDailyInterestRate;
  entity.newPrevRangeClosePrice = event.params.newPrevRangeClosePrice;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
  
  // Create a price update based on the new range close price
  let priceUpdate = new PriceUpdate(id + "-price");
  priceUpdate.price = event.params.newPrevRangeClosePrice;
  priceUpdate.timestamp = event.block.timestamp;
  priceUpdate.priceId = event.params.index;
  priceUpdate.blockNumber = event.block.number;
  priceUpdate.transactionHash = event.transaction.hash;
  priceUpdate.save();
  
  // Update protocol metrics
  updateProtocolMetricsWithPrice(event.params.newPrevRangeClosePrice, event.block.timestamp);
  updateDailyStatsWithPrice(event.block.timestamp, event.params.newPrevRangeClosePrice);
}
