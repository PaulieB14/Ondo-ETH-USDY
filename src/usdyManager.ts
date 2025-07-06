import {
  MintRequested as MintRequestedEvent,
  MintCompleted as MintCompletedEvent,
  RedemptionRequested as RedemptionRequestedEvent,
  RedemptionCompleted as RedemptionCompletedEvent
} from "../generated/USDYManager/USDYManager"
import {
  User,
  MintRequested,
  MintCompleted,
  RedemptionRequested,
  RedemptionCompleted,
  ProtocolMetrics,
  DailyProtocolStats
} from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHex())
  if (user == null) {
    user = new User(address.toHex())
    user.address = address
    user.usdyBalance = BigInt.fromI32(0)
    user.rusdyBalance = BigInt.fromI32(0)
    user.rusdyShares = BigInt.fromI32(0)
    user.totalMinted = BigInt.fromI32(0)
    user.totalRedeemed = BigInt.fromI32(0)
    user.mintCount = BigInt.fromI32(0)
    user.redemptionCount = BigInt.fromI32(0)
    user.lastUpdated = BigInt.fromI32(0)
    user.save()
    
    // Update protocol metrics
    updateProtocolMetrics()
  }
  return user
}

function updateProtocolMetrics(): void {
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
  metrics.totalUsers = metrics.totalUsers.plus(BigInt.fromI32(1))
  metrics.save()
}

function updateDailyStats(timestamp: BigInt, volumeUSD: BigInt, isMint: boolean): void {
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
  
  dailyStats.volumeUSD = dailyStats.volumeUSD.plus(volumeUSD)
  if (isMint) {
    dailyStats.totalMints = dailyStats.totalMints.plus(BigInt.fromI32(1))
  } else {
    dailyStats.totalRedemptions = dailyStats.totalRedemptions.plus(BigInt.fromI32(1))
  }
  dailyStats.save()
}

export function handleMintRequested(event: MintRequestedEvent): void {
  let user = getOrCreateUser(event.params.user)
  
  let entity = new MintRequested(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = user.id
  entity.depositId = event.params.depositId
  entity.collateralAmountDeposited = event.params.collateralAmountDeposited
  entity.depositAmountAfterFee = event.params.depositAmountAfterFee
  entity.feeAmount = event.params.feeAmount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleMintCompleted(event: MintCompletedEvent): void {
  let user = getOrCreateUser(event.params.user)
  
  // Update user stats
  user.totalMinted = user.totalMinted.plus(event.params.rwaAmountOut)
  user.mintCount = user.mintCount.plus(BigInt.fromI32(1))
  user.lastUpdated = event.block.timestamp
  user.save()
  
  let entity = new MintCompleted(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = user.id
  entity.depositId = event.params.depositId
  entity.rwaAmountOut = event.params.rwaAmountOut
  entity.collateralAmountDeposited = event.params.collateralAmountDeposited
  entity.price = event.params.price
  entity.priceId = event.params.priceId
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
  
  // Update protocol metrics
  let metrics = ProtocolMetrics.load("protocol")
  if (metrics != null) {
    metrics.totalMints = metrics.totalMints.plus(BigInt.fromI32(1))
    metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(event.params.collateralAmountDeposited)
    metrics.currentPrice = event.params.price
    metrics.lastUpdated = event.block.timestamp
    metrics.save()
  }
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, event.params.collateralAmountDeposited, true)
}

export function handleRedemptionRequested(event: RedemptionRequestedEvent): void {
  let user = getOrCreateUser(event.params.user)
  
  let entity = new RedemptionRequested(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = user.id
  entity.redemptionId = event.params.redemptionId
  entity.rwaAmountIn = event.params.rwaAmountIn
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleRedemptionCompleted(event: RedemptionCompletedEvent): void {
  let user = getOrCreateUser(event.params.user)
  
  // Update user stats
  user.totalRedeemed = user.totalRedeemed.plus(event.params.rwaAmountRequested)
  user.redemptionCount = user.redemptionCount.plus(BigInt.fromI32(1))
  user.lastUpdated = event.block.timestamp
  user.save()
  
  let entity = new RedemptionCompleted(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = user.id
  entity.redemptionId = event.params.redemptionId
  entity.rwaAmountRequested = event.params.rwaAmountRequested
  entity.collateralAmountReturned = event.params.collateralAmountReturned
  entity.price = event.params.price
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
  
  // Update protocol metrics
  let metrics = ProtocolMetrics.load("protocol")
  if (metrics != null) {
    metrics.totalRedemptions = metrics.totalRedemptions.plus(BigInt.fromI32(1))
    metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(event.params.collateralAmountReturned)
    metrics.currentPrice = event.params.price
    metrics.lastUpdated = event.block.timestamp
    metrics.save()
  }
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, event.params.collateralAmountReturned, false)
}
