import {
  MintRequested as MintRequestedEvent,
  MintCompleted as MintCompletedEvent,
  RedemptionRequested as RedemptionRequestedEvent,
  RedemptionCompleted as RedemptionCompletedEvent
} from "../generated/USDYManager/USDYManager"
import {
  MintRequested,
  MintCompleted,
  RedemptionRequested,
  RedemptionCompleted
} from "../generated/schema"

export function handleMintRequested(event: MintRequestedEvent): void {
  let entity = new MintRequested(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = event.params.user
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
  let entity = new MintCompleted(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = event.params.user
  entity.depositId = event.params.depositId
  entity.rwaAmountOut = event.params.rwaAmountOut
  entity.collateralAmountDeposited = event.params.collateralAmountDeposited
  entity.price = event.params.price
  entity.priceId = event.params.priceId
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleRedemptionRequested(event: RedemptionRequestedEvent): void {
  let entity = new RedemptionRequested(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = event.params.user
  entity.redemptionId = event.params.redemptionId
  entity.rwaAmountIn = event.params.rwaAmountIn
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleRedemptionCompleted(event: RedemptionCompletedEvent): void {
  let entity = new RedemptionCompleted(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.user = event.params.user
  entity.redemptionId = event.params.redemptionId
  entity.rwaAmountRequested = event.params.rwaAmountRequested
  entity.collateralAmountReturned = event.params.collateralAmountReturned
  entity.price = event.params.price
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
} 