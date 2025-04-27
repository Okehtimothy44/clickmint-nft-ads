;; Ad Campaign NFT Contract
;; A SIP-009 compliant NFT contract for managing and tracking online ad campaigns
;; Part of the ClickMint platform

;; Error Codes
(define-constant ERR_UNAUTHORIZED u1000)
(define-constant ERR_CAMPAIGN_NOT_FOUND u1001)
(define-constant ERR_INVALID_CAMPAIGN_DATA u1002)
(define-constant ERR_CAMPAIGN_ALREADY_EXISTS u1003)
(define-constant ERR_TRANSFER_FAILED u1004)
(define-constant ERR_INVALID_METRICS u1005)

;; Contract Owner
(define-data-var contract-owner principal tx-sender)

;; Campaign Metadata Structure
(define-map campaigns 
  uint 
  {
    name: (string-ascii 100),
    target-audience: (string-ascii 100),
    start-date: uint,
    end-date: uint,
    creator: principal,
    performance-metrics: (tuple 
      (impressions uint)
      (clicks uint)
      (conversions uint)
    )
  }
)

;; NFT Mapping (follows SIP-009)
(define-non-fungible-token ad-campaign uint)

;; Royalty Tracking
(define-map royalties uint principal)

;; Total Supply Tracking
(define-data-var last-token-id uint u0)

;; Authorization Check
(define-private (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

;; Mint a new ad campaign NFT
(define-public (mint-ad-campaign 
  (name (string-ascii 100))
  (target-audience (string-ascii 100))
  (start-date uint)
  (end-date uint)
)
  (let 
    (
      (token-id (+ (var-get last-token-id) u1))
      (campaign-data {
        name: name,
        target-audience: target-audience,
        start-date: start-date,
        end-date: end-date,
        creator: tx-sender,
        performance-metrics: {
          impressions: u0,
          clicks: u0, 
          conversions: u0
        }
      })
    )
    ;; Validate campaign dates
    (asserts! (< start-date end-date) (err ERR_INVALID_CAMPAIGN_DATA))
    
    ;; Mint the NFT
    (try! (nft-mint? ad-campaign token-id tx-sender))
    
    ;; Store campaign metadata
    (map-set campaigns token-id campaign-data)
    
    ;; Store royalty information
    (map-set royalties token-id tx-sender)
    
    ;; Update last token ID
    (var-set last-token-id token-id)
    
    (ok token-id)
  )
)

;; Transfer an ad campaign NFT (SIP-009 compliant)
(define-public (transfer 
  (token-id uint) 
  (sender principal) 
  (recipient principal)
)
  (begin
    ;; Ensure sender is the current token owner
    (asserts! 
      (is-eq sender (unwrap! (nft-get-owner? ad-campaign token-id) (err ERR_CAMPAIGN_NOT_FOUND))) 
      (err ERR_UNAUTHORIZED)
    )
    
    ;; Check that sender is tx-sender (prevents unauthorized transfers)
    (asserts! (is-eq tx-sender sender) (err ERR_UNAUTHORIZED))
    
    ;; Perform the transfer
    (try! (nft-transfer? ad-campaign token-id sender recipient))
    
    (ok true)
  )
)

;; Get campaign details
(define-read-only (get-campaign-details (token-id uint))
  (map-get? campaigns token-id)
)

;; Update campaign performance metrics (only creator can update)
(define-public (update-campaign-metrics 
  (token-id uint)
  (impressions uint)
  (clicks uint)
  (conversions uint)
)
  (let 
    (
      (campaign (unwrap! (map-get? campaigns token-id) (err ERR_CAMPAIGN_NOT_FOUND)))
      (current-owner (unwrap! (nft-get-owner? ad-campaign token-id) (err ERR_CAMPAIGN_NOT_FOUND)))
    )
    ;; Only campaign creator can update metrics
    (asserts! (is-eq tx-sender (get creator campaign)) (err ERR_UNAUTHORIZED))
    
    ;; Update metrics
    (map-set campaigns token-id 
      (merge campaign {
        performance-metrics: {
          impressions: impressions,
          clicks: clicks,
          conversions: conversions
        }
      })
    )
    
    (ok true)
  )
)

;; Get the royalty recipient for a specific campaign
(define-read-only (get-royalty-recipient (token-id uint))
  (map-get? royalties token-id)
)

;; Transfer contract ownership (admin function)
(define-public (transfer-contract-ownership (new-owner principal))
  (begin
    ;; Only current contract owner can transfer ownership
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    
    ;; Update contract owner
    (var-set contract-owner new-owner)
    
    (ok true)
  )
)

;; Implement SIP-009 trait requirements
(define-read-only (get-last-token-id)
  (var-get last-token-id)
)

(define-read-only (get-token-uri (token-id uint))
  ;; Future: Could return IPFS/Arweave URI for campaign metadata
  (ok none)
)

(define-read-only (get-owner (token-id uint))
  (nft-get-owner? ad-campaign token-id)
)