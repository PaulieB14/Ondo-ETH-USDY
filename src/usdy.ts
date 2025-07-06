import {
  Transfer as TransferEvent,
  Approval as ApprovalEvent
} from "../generated/USDY/USDY"
import { 
  User, 
  Transfer, 
  Approval, 
  ProtocolMetrics, 
  DailyProtocolStats 
} from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

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

function updateDailyStats(timestamp: BigInt, volumeUSD: BigInt): void {
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
  dailyStats.save()
}

export function handleUSDYTransfer(event: TransferEvent): void {
  // Skip mint/burn transactions (from/to zero address)
  if (event.params.from.toHex() != ZERO_ADDRESS && event.params.to.toHex() != ZERO_ADDRESS) {
    // Update sender balance
    let fromUser = getOrCreateUser(event.params.from)
    fromUser.usdyBalance = fromUser.usdyBalance.minus(event.params.value)
    fromUser.lastUpdated = event.block.timestamp
    fromUser.save()
    
    // Update receiver balance
    let toUser = getOrCreateUser(event.params.to)
    toUser.usdyBalance = toUser.usdyBalance.plus(event.params.value)
    toUser.lastUpdated = event.block.timestamp
    toUser.save()
    
    // Create Transfer entity
    let transfer = new Transfer(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    transfer.from = fromUser.id
    transfer.to = toUser.id
    transfer.amount = event.params.value
    transfer.token = "USDY"
    transfer.blockNumber = event.block.number
    transfer.blockTimestamp = event.block.timestamp
    transfer.transactionHash = event.transaction.hash
    transfer.save()
    
    // Update daily stats
    updateDailyStats(event.block.timestamp, event.params.value)
  }
}

export function handleUSDYApproval(event: ApprovalEvent): void {
  let approval = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  approval.owner = event.params.owner
  approval.spender = event.params.spender
  approval.value = event.params.value
  approval.token = "USDY"
  approval.blockNumber = event.block.number
  approval.blockTimestamp = event.block.timestamp
  approval.transactionHash = event.transaction.hash
  approval.save()
}
