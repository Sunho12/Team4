'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'

type ModalType = 'usage' | 'plan' | 'payment' | 'membership' | 'gift' | 'smishing' | 'usedphone' | 'search' | null

export default function TworldPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [activeTab, setActiveTab] = useState<'eat' | 'buy' | 'play'>('eat')
  const [currentBanner, setCurrentBanner] = useState(1)
  const [showAssistant, setShowAssistant] = useState(false)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // model-viewer 스크립트 동적 로드
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
    document.head.appendChild(script)

    // 로그인 상태 확인
    checkAuth()

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        setUserName(data.user.name)
      }
    } catch (error) {
      // 로그인하지 않은 상태
      setIsLoggedIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setIsLoggedIn(false)
      setUserName('')
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Idle timer logic
  useEffect(() => {
    console.log('[DEBUG] Modal changed:', activeModal)

    // 모달이 없으면 assistant 숨김
    if (!activeModal) {
      console.log('[DEBUG] No modal, hiding assistant')
      setShowAssistant(false)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      return
    }

    console.log('[DEBUG] Modal opened, starting timer')

    const resetTimer = () => {
      console.log('[DEBUG] Timer reset')
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }

      idleTimerRef.current = setTimeout(() => {
        console.log('[DEBUG] 5 seconds passed, showing assistant')
        setShowAssistant(true)
      }, 2500) // 5초
    }

    // 초기 타이머 시작
    resetTimer()

    // 클릭 이벤트만 감지 (마우스 움직임, 스크롤은 무시)
    const handleClick = () => {
      console.log('[DEBUG] Click detected, resetting timer')
      resetTimer()
    }

    window.addEventListener('click', handleClick)

    return () => {
      console.log('[DEBUG] Cleanup')
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      window.removeEventListener('click', handleClick)
    }
  }, [activeModal])

  // showAssistant 변경 감지
  useEffect(() => {
    console.log('[DEBUG] showAssistant changed to:', showAssistant)
  }, [showAssistant])

  // 배너 자동 슬라이드 (4.5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => prev === 2 ? 1 : 2)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  // 모달 닫기
  const closeModal = () => setActiveModal(null)

  // 배너 전환
  const nextBanner = () => setCurrentBanner(currentBanner === 2 ? 1 : 2)
  const prevBanner = () => setCurrentBanner(currentBanner === 1 ? 2 : 1)

  // 말풍선에 표시할 메시지 (공손하고 긴 메시지)
  const getSpeechBubbleMessage = (): string => {
    const bubbleMap: Record<string, string> = {
      'usage': '실시간 사용량을 확인하고 계시네요! 데이터 요금제나 추가 옵션에 대해 궁금하신 점이 있으신가요?',
      'plan': '요금제 변경을 고려하고 계시군요! 고객님께 최적의 요금제를 추천해드릴 수 있어요.',
      'payment': '요금 납부 화면을 보고 계시네요. 납부 방법이나 요금 내역에 대해 도움이 필요하신가요?',
      'membership': '멤버십 혜택을 확인하고 계시네요! 더 많은 혜택 정보를 원하시나요?',
      'gift': '데이터 선물 기능을 살펴보고 계시군요! 선물 방법에 대해 도움드릴까요?',
      'smishing': '스미싱 대처 방법을 확인하고 계시네요. 추가로 보안 관련 문의사항이 있으신가요?',
      'usedphone': '중고폰 판매를 고려하고 계시군요! 판매 절차나 예상 가격에 대해 궁금하신 점이 있으신가요?',
      'search': '무엇을 찾고 계신가요? 제가 도와드릴 수 있어요!'
    }

    return activeModal ? bubbleMap[activeModal] || '무엇을 도와드릴까요?' : '무엇을 도와드릴까요?'
  }

  // 챗봇에 보낼 메시지 (짧고 간단한 메시지)
  const getChatMessage = (): string => {
    const chatMap: Record<string, string> = {
      'usage': '실시간 사용량 확인',
      'plan': '요금제 변경 상담',
      'payment': '요금 납부 안내',
      'membership': '멤버십 혜택 안내',
      'gift': '데이터 선물하기',
      'smishing': '스미싱 대처 방법',
      'usedphone': '중고폰 판매 문의',
      'search': '검색 도움'
    }

    return activeModal ? chatMap[activeModal] || '상담 문의' : '상담 문의'
  }

  // Assistant 클릭 핸들러
  const handleAssistantClick = () => {
    const chatMessage = getChatMessage()
    localStorage.setItem('chatContext', chatMessage)
    // 로그인 상태면 챗봇으로, 아니면 로그인 페이지로
    window.location.href = isLoggedIn ? '/chat' : '/user/login'
  }

  // 멤버십 혜택 데이터
  const membershipData = {
    eat: [
      { brand: '배스킨라빈스', image: '/Tworld/eat/baskinrabbins.png', benefit: '아이스크림 20% 할인' },
      { brand: '공차', image: '/Tworld/eat/gongcha.png', benefit: '음료 1+1 쿠폰' },
      { brand: '파리바게뜨', image: '/Tworld/eat/parisbaguette.png', benefit: '케이크 15% 할인' }
    ],
    buy: [
      { brand: '세븐일레븐', image: '/Tworld/buy/7eleven.png', benefit: '3,000원 할인 쿠폰' },
      { brand: 'CU', image: '/Tworld/buy/CU.png', benefit: '5,000원 할인 쿠폰' },
      { brand: '이마트', image: '/Tworld/buy/emart.png', benefit: '10,000원 상품권' }
    ],
    play: [
      { brand: 'CGV', image: '/Tworld/play/CGV.png', benefit: '영화 2,000원 할인' },
      { brand: '롯데월드', image: '/Tworld/play/lotteworld.png', benefit: '자유이용권 30% 할인' },
      { brand: 'SK 렌터카', image: '/Tworld/play/skrentcar.png', benefit: '렌터카 20% 할인' }
    ]
  }

  return (
    <>
      <style jsx global>{`
        /* T world 공식 컬러 정의 */
        :root {
          --t-blue: #3617CE;
          --t-red: #FF404E;
          --bg-gray: #F9F9FB;
          --text-black: #111111;
          --text-gray: #666666;
          --border-light: #EEEEEE;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
        body { background-color: var(--bg-gray); color: var(--text-black); letter-spacing: -0.5px; }

        /* Header */
        .tworld-header { background: #fff; border-bottom: 1px solid var(--border-light); height: 72px; display: flex; align-items: center; position: sticky; top: 0; z-index: 100; }
        .header-inner { width: 100%; max-width: 1080px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
        .logo { display: flex; align-items: center; cursor: pointer; }
        .nav { display: flex; gap: 40px; }
        .nav a { text-decoration: none; color: var(--text-black); font-size: 17px; font-weight: 600; cursor: pointer; }
        .nav a:hover { color: var(--t-blue); }
        .user-menu { font-size: 14px; color: var(--text-gray); }

        /* Main Section */
        .container { max-width: 1080px; margin: 40px auto; padding: 0 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .section-header h2 { font-size: 24px; font-weight: 700; }
        .section-header .more { font-size: 14px; color: var(--text-gray); text-decoration: none; cursor: pointer; }

        /* Quick Menu Grid */
        .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
        .quick-card { background: #fff; padding: 40px 20px; border-radius: 20px; text-align: center; transition: all 0.3s ease; border: 2px solid var(--border-light); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center; min-height: 120px; }
        .quick-card:hover { border-color: var(--t-blue); transform: translateY(-4px); box-shadow: 0 8px 20px rgba(54,23,206,0.1); background: linear-gradient(135deg, #ffffff, #f8f9ff); }
        .quick-card span { display: block; font-weight: 700; font-size: 18px; color: var(--text-black); }

        /* Banner Section */
        .banner { background: var(--t-blue); border-radius: 24px; padding: 40px; color: #fff; margin-bottom: 48px; position: relative; overflow: hidden; }
        .banner h3 { font-size: 28px; margin-bottom: 12px; font-weight: 700; line-height: 1.3; }
        .banner p { font-size: 16px; opacity: 0.9; }
        .banner .btn-white { display: inline-block; margin-top: 24px; background: #fff; color: var(--t-blue); padding: 12px 24px; border-radius: 30px; font-weight: 700; text-decoration: none; font-size: 15px; cursor: pointer; }

        /* Info Grid */
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-card { background: #fff; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; cursor: pointer; border: 1px solid var(--border-light); }
        .info-card:hover { border-color: #ddd; }
        .info-card .img-placeholder { width: 80px; height: 80px; background: #f0f0f0; border-radius: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .info-text .title { font-weight: 700; font-size: 18px; margin-bottom: 6px; }
        .info-text .desc { font-size: 14px; color: var(--text-gray); line-height: 1.4; }

        /* Footer */
        .tworld-footer { background: #fff; border-top: 1px solid var(--border-light); padding: 60px 0; margin-top: 80px; color: var(--text-gray); font-size: 13px; }
        .footer-inner { max-width: 1080px; margin: 0 auto; padding: 0 20px; line-height: 1.8; }
        .footer-logo { font-size: 20px; font-weight: 800; color: #ccc; margin-bottom: 20px; }

        /* Chatbot Button */
        .chatbot-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 70px;
          height: 70px;
          background: var(--t-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(54, 23, 206, 0.3);
          transition: all 0.3s ease;
          z-index: 1003;
          text-decoration: none;
        }
        .chatbot-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(54, 23, 206, 0.5);
        }
        .chatbot-button .icon {
          font-size: 32px;
        }

        /* 3D Character */
        .character-container {
          position: fixed;
          bottom: 110px;
          right: 15px;
          width: 150px;
          height: 150px;
          z-index: 1001;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .character-container.show {
          opacity: 1;
          pointer-events: auto;
        }
        .character-container model-viewer {
          width: 100%;
          height: 100%;
          display: block;
          cursor: pointer;
        }

        /* Speech Bubble */
        .speech-bubble {
          position: fixed;
          bottom: 280px;
          right: 40px;
          max-width: 300px;
          background: white;
          padding: 16px 20px;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1002;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid var(--t-blue);
        }
        .speech-bubble.show {
          opacity: 1;
          transform: translateY(0);
        }
        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -10px;
          right: 40px;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid white;
        }
        .speech-bubble-text {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-black);
          font-weight: 500;
        }
        .speech-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(54, 23, 206, 0.2);
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        /* Modal Content */
        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          animation: modalSlideUp 0.3s ease;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: var(--text-gray);
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: var(--text-black);
        }

        .modal-body {
          padding: 24px;
        }

        /* Usage Bar */
        .usage-bar-container {
          margin-bottom: 24px;
        }

        .usage-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .usage-bar {
          height: 24px;
          background: #f0f0f0;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .usage-fill {
          height: 100%;
          border-radius: 12px;
          transition: width 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .usage-fill.green { background: linear-gradient(90deg, #10b981, #34d399); }
        .usage-fill.yellow { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .usage-fill.red { background: linear-gradient(90deg, #ef4444, #f87171); }

        /* Plan Card */
        .plan-card {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .plan-card:hover {
          border-color: var(--t-blue);
          transform: translateY(-2px);
        }

        .plan-card.recommended {
          border-color: var(--t-blue);
          background: linear-gradient(135deg, #f0f0ff, #fafafa);
        }

        .plan-badge {
          display: inline-block;
          background: var(--t-blue);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .plan-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .plan-price {
          font-size: 28px;
          font-weight: 800;
          color: var(--t-blue);
          margin-bottom: 16px;
        }

        .plan-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .plan-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-gray);
        }

        /* Payment Info */
        .payment-amount {
          background: linear-gradient(135deg, var(--t-blue), #5b3fd1);
          color: white;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 24px;
        }

        .payment-amount .label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .payment-amount .amount {
          font-size: 48px;
          font-weight: 800;
        }

        .payment-amount .dday {
          font-size: 16px;
          margin-top: 12px;
          opacity: 0.9;
        }

        .payment-methods {
          display: grid;
          gap: 12px;
        }

        .payment-method {
          padding: 16px;
          border: 2px solid var(--border-light);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .payment-method:hover {
          border-color: var(--t-blue);
          background: #f8f9ff;
        }

        /* Coupon Card */
        .coupon-card {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .coupon-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }

        .coupon-discount {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .coupon-desc {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 12px;
        }

        .coupon-expiry {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Button */
        .btn-primary {
          background: var(--t-blue);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          background: #2b0fa8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(54, 23, 206, 0.3);
        }

        /* Input */
        .input-group {
          margin-bottom: 16px;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--border-light);
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--t-blue);
        }

        /* Guide Steps */
        .guide-steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .guide-step {
          display: flex;
          gap: 16px;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: var(--t-blue);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .step-desc {
          font-size: 14px;
          color: var(--text-gray);
          line-height: 1.6;
        }

        /* Membership Tabs */
        .membership-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid var(--border-light);
          padding-bottom: 0;
        }

        .membership-tab {
          flex: 1;
          padding: 14px 20px;
          background: #f5f5f5;
          border: none;
          border-radius: 12px 12px 0 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-gray);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .membership-tab:hover {
          background: #e8e8e8;
        }

        .membership-tab.active {
          background: var(--t-blue);
          color: white;
        }

        .membership-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--t-blue);
        }

        /* Brand Cards */
        .brand-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .brand-card {
          background: white;
          border: 2px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .brand-card:hover {
          border-color: var(--t-blue);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(54, 23, 206, 0.15);
        }

        .brand-logo {
          width: 100%;
          height: 120px;
          object-fit: contain;
          margin-bottom: 16px;
          border-radius: 8px;
        }

        .brand-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-black);
        }

        .brand-benefit {
          font-size: 14px;
          color: var(--t-blue);
          font-weight: 600;
        }

        /* Main Banner */
        .main-banner-container {
          position: relative;
          width: 100%;
          max-width: 1080px;
          margin: 40px auto 40px;
          padding: 0 20px;
          overflow: hidden;
        }

        .main-banner-wrapper {
          position: relative;
          width: 100%;
          height: 300px;
          border-radius: 24px;
          overflow: hidden;
        }

        .main-banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.5s ease;
        }

        .banner-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 24px;
          color: var(--text-black);
          z-index: 10;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .banner-arrow:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .banner-arrow.left {
          left: 20px;
        }

        .banner-arrow.right {
          right: 20px;
        }

        .banner-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .banner-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .banner-dot.active {
          width: 24px;
          border-radius: 5px;
          background: white;
        }

        /* Mobile Responsive - iPhone Pro 기준 (393px) */
        @media (max-width: 768px) {
          /* Header */
          .tworld-header { height: 60px; }
          .header-inner { padding: 0 16px; }
          .logo img { width: 32px; height: 32px; }
          .nav { display: none; } /* 모바일에서 네비게이션 숨김 */
          .user-menu { font-size: 12px; }

          /* Container */
          .container { padding: 0 16px; margin: 24px auto; }
          .section-header h2 { font-size: 20px; }
          .section-header .more { font-size: 13px; }

          /* Quick Menu Grid - 4열에서 2열로 */
          .quick-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 32px;
          }
          .quick-card {
            padding: 24px 16px;
            min-height: 100px;
            border-radius: 16px;
          }
          .quick-card span { font-size: 15px; }

          /* Banner */
          .banner {
            padding: 28px 24px;
            border-radius: 20px;
            margin-bottom: 32px;
          }
          .banner h3 { font-size: 22px; margin-bottom: 10px; }
          .banner p { font-size: 14px; }
          .banner .btn-white {
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 14px;
          }

          /* Main Banner */
          .main-banner-container {
            margin: 24px auto 24px;
            padding: 0 16px;
          }
          .main-banner-wrapper { height: 200px; border-radius: 16px; }
          .banner-arrow {
            width: 36px;
            height: 36px;
            font-size: 20px;
          }
          .banner-arrow.left { left: 12px; }
          .banner-arrow.right { right: 12px; }

          /* Info Grid - 2열에서 1열로 */
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .info-card {
            padding: 20px;
            border-radius: 16px;
          }
          .info-card .img-placeholder {
            width: 64px;
            height: 64px;
            font-size: 28px;
          }
          .info-text .title { font-size: 16px; }
          .info-text .desc { font-size: 13px; }

          /* Footer */
          .tworld-footer { padding: 40px 0; margin-top: 60px; }
          .footer-inner { padding: 0 16px; font-size: 11px; line-height: 1.6; }
          .footer-logo { font-size: 18px; margin-bottom: 16px; }

          /* Chatbot Button */
          .chatbot-button {
            width: 60px;
            height: 60px;
            bottom: 20px;
            right: 20px;
          }
          .chatbot-button .icon { font-size: 28px; }

          /* 3D Character */
          .character-container {
            width: 120px;
            height: 120px;
            bottom: 90px;
            right: 10px;
          }

          /* Modal */
          .modal-overlay { padding: 12px; }
          .modal-content {
            max-width: 100%;
            max-height: 90vh;
            border-radius: 20px;
          }
          .modal-header { padding: 20px; }
          .modal-header h2 { font-size: 20px; }
          .modal-body { padding: 20px; }

          /* Brand Grid - 3열에서 1열로 */
          .brand-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .brand-card {
            padding: 16px;
            border-radius: 12px;
          }
          .brand-logo { height: 100px; margin-bottom: 12px; }
          .brand-name { font-size: 15px; }
          .brand-benefit { font-size: 13px; }

          /* Membership Tabs */
          .membership-tab {
            padding: 12px 16px;
            font-size: 13px;
            border-radius: 10px 10px 0 0;
          }

          /* Plan Card */
          .plan-card { padding: 16px; border-radius: 12px; }
          .plan-name { font-size: 18px; }
          .plan-price { font-size: 24px; margin-bottom: 12px; }
          .plan-feature { font-size: 13px; }

          /* Payment Amount */
          .payment-amount { padding: 24px; border-radius: 12px; }
          .payment-amount .amount { font-size: 40px; }
          .payment-amount .dday { font-size: 14px; }

          /* Usage Bar */
          .usage-bar { height: 20px; border-radius: 10px; }
          .usage-fill { font-size: 11px; padding-right: 10px; }

          /* Coupon Card */
          .coupon-card { padding: 20px; border-radius: 12px; }
          .coupon-discount { font-size: 28px; }
          .coupon-desc { font-size: 13px; }

          /* Button */
          .btn-primary {
            padding: 12px 24px;
            font-size: 15px;
            border-radius: 10px;
          }

          /* Input */
          .input-field {
            padding: 10px 14px;
            font-size: 15px;
            border-radius: 10px;
          }
          .input-label { font-size: 13px; }

          /* Guide Steps */
          .step-number { width: 28px; height: 28px; font-size: 14px; }
          .step-title { font-size: 15px; }
          .step-desc { font-size: 13px; }

          /* Payment Method */
          .payment-method { padding: 14px; border-radius: 10px; }
        }
      `}</style>

      <header className="tworld-header">
        <div className="header-inner">
          <div className="logo">
            <Image
              src="/Tworld/T.png"
              alt="T world"
              width={40}
              height={40}
              priority
            />
          </div>
          <nav className="nav">
            <a href="https://shop.tworld.co.kr/shop/main?referrer=" target="_blank" rel="noopener noreferrer">T 다이렉트샵</a>
            <Link href="/customer/history" style={{ textDecoration: 'none', color: 'inherit' }}>MY</Link>
            <a onClick={() => setActiveModal('membership')}>혜택</a>
            <a onClick={() => setActiveModal('search')}>검색</a>
          </nav>
          <div className="user-menu">
            {isLoggedIn ? (
              <>
                <span style={{ fontWeight: '600', color: '#3617CE' }}>{userName}님</span>
                {' | '}
                <a onClick={handleSignOut} style={{ cursor: 'pointer' }}>로그아웃</a>
              </>
            ) : (
              <>
                <Link href="/user/login" style={{ textDecoration: 'none', color: 'inherit' }}>로그인</Link>
                {' | '}
                <Link href="/auth/signup" style={{ textDecoration: 'none', color: 'inherit' }}>회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Banner */}
      <div className="main-banner-container">
        <div className="main-banner-wrapper">
          <Image
            src={`/Tworld/main_banner/banner${currentBanner}.png`}
            alt={`Banner ${currentBanner}`}
            fill
            className="main-banner-image"
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className="banner-dots">
            <div
              className={`banner-dot ${currentBanner === 1 ? 'active' : ''}`}
              onClick={() => setCurrentBanner(1)}
            />
            <div
              className={`banner-dot ${currentBanner === 2 ? 'active' : ''}`}
              onClick={() => setCurrentBanner(2)}
            />
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section-header">
          <h2>자주 찾는 메뉴</h2>
        </div>
        <div className="quick-grid">
          <div className="quick-card" onClick={() => setActiveModal('plan')}>
            <span>요금제 변경</span>
          </div>
          <div className="quick-card" onClick={() => setActiveModal('usage')}>
            <span>실시간 잔여량</span>
          </div>
          <div className="quick-card" onClick={() => setActiveModal('payment')}>
            <span>요금 납부</span>
          </div>
          <div className="quick-card" onClick={() => setActiveModal('membership')}>
            <span>멤버십 혜택</span>
          </div>
        </div>

        <div className="banner">
          <h3>데이터가 모자랄 땐?<br />T끼리 데이터 선물하기</h3>
          <p>가족, 친구에게 마음을 전해보세요.</p>
          <span className="btn-white" onClick={() => setActiveModal('gift')}>선물하러 가기</span>
        </div>

        <div className="section-header">
          <h2>이럴 땐 이렇게 해 보세요</h2>
          <a className="more" onClick={() => alert('전체 가이드 준비 중입니다')}>전체보기 &gt;</a>
        </div>
        <div className="info-grid">
          <div className="info-card" onClick={() => setActiveModal('smishing')}>
            <div className="img-placeholder">🛡️</div>
            <div className="info-text">
              <div className="title">스미싱 대처 방법</div>
              <div className="desc">의심스러운 문자를 받았을 때<br />안전하게 대처하는 가이드를 확인하세요.</div>
            </div>
          </div>
          <div className="info-card" onClick={() => setActiveModal('usedphone')}>
            <div className="img-placeholder">📱</div>
            <div className="info-text">
              <div className="title">중고폰 판매(T 안심보상)</div>
              <div className="desc">사용하던 폰, 가장 쉽고 안전하게<br />보상받고 판매하는 방법</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="tworld-footer">
        <div className="footer-inner">
          <div className="footer-logo">T world</div>
          <p>서울특별시 중구 을지로 65(을지로2가) SK텔레콤빌딩 | 대표이사/사장 유영상</p>
          <p>사업자등록번호 104-81-37225 | 고객센터 국번없이 114(무료) 또는 080-011-6000</p>
          <p style={{ marginTop: '15px' }}>COPYRIGHT © SK TELECOM CO., LTD. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Chatbot Button */}
      <Link href={isLoggedIn ? "/chat" : "/user/login"} className="chatbot-button">
        <div className="icon">💬</div>
      </Link>

      {/* Speech Bubble */}
      {showAssistant && activeModal && (
        <div className={`speech-bubble ${showAssistant ? 'show' : ''}`} onClick={handleAssistantClick}>
          <div className="speech-bubble-text">
            {getSpeechBubbleMessage()}
          </div>
        </div>
      )}

      {/* 3D Character */}
      <div
        className={`character-container ${showAssistant && activeModal ? 'show' : ''}`}
        suppressHydrationWarning
        onClick={handleAssistantClick}
        dangerouslySetInnerHTML={{
          __html: `
            <model-viewer
              src="/Tworld/models/model_bye.glb"
              camera-orbit="0deg 75deg 105%"
              animation-name="*"
              autoplay
              loop>
            </model-viewer>
          `
        }}
      />

      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {activeModal === 'usage' && (
              <>
                <div className="modal-header">
                  <h2>실시간 사용량</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f0ff', borderRadius: '12px', border: '1px solid var(--t-blue)' }}>
                    <div style={{ fontSize: '14px', color: 'var(--t-blue)', marginBottom: '4px' }}>현재 요금제</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>5GX 프라임 (데이터 무제한)</div>
                  </div>

                  <div className="usage-bar-container">
                    <div className="usage-label">
                      <span><strong>데이터</strong></span>
                      <span style={{ color: 'var(--t-blue)', fontWeight: '600' }}>이번 달 사용량: 85.3GB</span>
                    </div>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--t-blue)' }}>무제한 ∞</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>마음껏 사용하세요</div>
                    </div>
                  </div>

                  <div className="usage-bar-container">
                    <div className="usage-label">
                      <span><strong>음성통화</strong></span>
                      <span style={{ color: 'var(--t-blue)', fontWeight: '600' }}>무제한</span>
                    </div>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-gray)' }}>이번 달 통화시간: 3시간 25분</div>
                    </div>
                  </div>

                  <div className="usage-bar-container">
                    <div className="usage-label">
                      <span><strong>문자메시지</strong></span>
                      <span style={{ color: 'var(--t-blue)', fontWeight: '600' }}>무제한</span>
                    </div>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-gray)' }}>이번 달 발송: 127건</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', opacity: '0.9' }}>무제한 요금제로</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>제한 없이 자유롭게!</div>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'plan' && (
              <>
                <div className="modal-header">
                  <h2>요금제 변경</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '4px' }}>현재 요금제</div>
                    <div style={{ fontSize: '20px', fontWeight: '700' }}>5GX 프라임</div>
                    <div style={{ fontSize: '16px', color: 'var(--t-blue)', fontWeight: '600', marginTop: '4px' }}>월 89,000원</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '8px' }}>데이터 무제한 • VIP 멤버십</div>
                  </div>

                  {/* 프리미엄 등급 */}
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-gray)' }}>
                    👑 프리미엄 등급 (무제한 + VIP)
                  </div>

                  <div className="plan-card">
                    <span className="plan-badge" style={{ background: '#FFD700' }}>최상위</span>
                    <div className="plan-name">5GX 플래티넘</div>
                    <div className="plan-price">125,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 무제한</div>
                      <div className="plan-feature">✓ 우주패스 all/life 무료</div>
                      <div className="plan-feature">✓ 스마트기기 2회선 무료</div>
                      <div className="plan-feature">✓ VIP 멤버십</div>
                    </div>
                  </div>

                  <div className="plan-card">
                    <div className="plan-name">5GX 프리미엄</div>
                    <div className="plan-price">109,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 무제한</div>
                      <div className="plan-feature">✓ 우주패스 혜택</div>
                      <div className="plan-feature">✓ 스마트기기 1회선 무료</div>
                      <div className="plan-feature">✓ VIP 멤버십</div>
                    </div>
                  </div>

                  {/* 표준 무제한 등급 */}
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-gray)' }}>
                    ⭐ 표준 무제한 등급
                  </div>

                  <div className="plan-card recommended">
                    <span className="plan-badge">추천</span>
                    <div className="plan-name">5GX 프라임플러스</div>
                    <div className="plan-price">99,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 무제한</div>
                      <div className="plan-feature">✓ 우주패스/wavve/FLO 중 택1 무료</div>
                      <div className="plan-feature">✓ 스마트기기 2회선 50% 할인</div>
                      <div className="plan-feature">✓ VIP 멤버십</div>
                    </div>
                  </div>

                  {/* 대용량 등급 */}
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-gray)' }}>
                    📦 대용량 등급
                  </div>

                  <div className="plan-card">
                    <div className="plan-name">5G 함께플러스</div>
                    <div className="plan-price">79,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 250GB</div>
                      <div className="plan-feature">✓ 공유 데이터 40GB</div>
                      <div className="plan-feature">✓ 속도제어 5Mbps</div>
                      <div className="plan-feature" style={{ color: '#10b981' }}>💰 월 10,000원 절약</div>
                    </div>
                  </div>

                  {/* 중간 등급 */}
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-gray)' }}>
                    📱 중간 등급
                  </div>

                  <div className="plan-card">
                    <div className="plan-name">5G 베이직플러스</div>
                    <div className="plan-price">59,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 15GB</div>
                      <div className="plan-feature">✓ 기본 제공량 소진 시 속도제어 1Mbps</div>
                      <div className="plan-feature" style={{ color: '#10b981' }}>💰 월 30,000원 절약</div>
                    </div>
                  </div>

                  <div className="plan-card">
                    <div className="plan-name">5G 베이직</div>
                    <div className="plan-price">49,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 11GB</div>
                      <div className="plan-feature">✓ 속도제어 1Mbps</div>
                      <div className="plan-feature" style={{ color: '#10b981' }}>💰 월 40,000원 절약</div>
                    </div>
                  </div>

                  {/* 실속형 */}
                  <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-gray)' }}>
                    💡 실속형
                  </div>

                  <div className="plan-card">
                    <div className="plan-name">5G 컴팩트</div>
                    <div className="plan-price">39,000원<span style={{ fontSize: '16px', fontWeight: '400' }}>/월</span></div>
                    <div className="plan-features">
                      <div className="plan-feature">✓ 데이터 6GB</div>
                      <div className="plan-feature">✓ 속도제어 400kbps</div>
                      <div className="plan-feature">✓ 2024년 출시 실속형</div>
                      <div className="plan-feature" style={{ color: '#10b981' }}>💰 월 50,000원 절약</div>
                    </div>
                  </div>

                  <button className="btn-primary">요금제 변경 신청</button>
                </div>
              </>
            )}

            {activeModal === 'payment' && (
              <>
                <div className="modal-header">
                  <h2>요금 납부</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="payment-amount">
                    <div className="label">이번 달 납부 요금</div>
                    <div className="amount">89,000<span style={{ fontSize: '24px' }}>원</span></div>
                    <div className="dday">납부 기한 D-7</div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '8px' }}>요금 상세</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>5GX 프라임 (기본료)</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>89,000원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-gray)' }}>부가세</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-gray)' }}>포함</span>
                    </div>
                  </div>

                  <div className="payment-methods">
                    <div className="payment-method">
                      <span style={{ fontSize: '24px' }}>💳</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>신용카드</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>간편하게 카드로 결제</div>
                      </div>
                    </div>
                    <div className="payment-method">
                      <span style={{ fontSize: '24px' }}>🏦</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>계좌이체</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>수수료 없이 이체</div>
                      </div>
                    </div>
                    <div className="payment-method">
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>간편결제</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>카카오페이, 네이버페이</div>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary">납부하기</button>
                </div>
              </>
            )}

            {activeModal === 'membership' && (
              <>
                <div className="modal-header">
                  <h2>멤버십 혜택</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="membership-tabs">
                    <button
                      className={`membership-tab ${activeTab === 'eat' ? 'active' : ''}`}
                      onClick={() => setActiveTab('eat')}
                    >
                      # EAT 뭐먹지
                    </button>
                    <button
                      className={`membership-tab ${activeTab === 'buy' ? 'active' : ''}`}
                      onClick={() => setActiveTab('buy')}
                    >
                      # BUY 뭐사지
                    </button>
                    <button
                      className={`membership-tab ${activeTab === 'play' ? 'active' : ''}`}
                      onClick={() => setActiveTab('play')}
                    >
                      # PLAY 뭐하지
                    </button>
                  </div>

                  <div className="brand-grid" key={activeTab}>
                    {membershipData[activeTab].map((item, index) => (
                      <div key={index} className="brand-card">
                        <Image
                          src={item.image}
                          alt={item.brand}
                          width={200}
                          height={120}
                          className="brand-logo"
                        />
                        <div className="brand-name">{item.brand}</div>
                        <div className="brand-benefit">{item.benefit}</div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-primary">혜택 받기</button>
                </div>
              </>
            )}

            {activeModal === 'gift' && (
              <>
                <div className="modal-header">
                  <h2>데이터 선물하기</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="input-group">
                    <label className="input-label">선물할 데이터</label>
                    <select className="input-field">
                      <option>1GB (5,000원)</option>
                      <option>3GB (12,000원)</option>
                      <option>5GB (18,000원)</option>
                      <option>10GB (30,000원)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">받는 사람 전화번호</label>
                    <input type="tel" className="input-field" placeholder="010-0000-0000" />
                  </div>

                  <div className="input-group">
                    <label className="input-label">메시지 (선택)</label>
                    <textarea className="input-field" rows={3} placeholder="마음을 전하는 메시지를 입력하세요"></textarea>
                  </div>

                  <button className="btn-primary">선물하기</button>
                </div>
              </>
            )}

            {activeModal === 'smishing' && (
              <>
                <div className="modal-header">
                  <h2>스미싱 대처 방법</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="guide-steps">
                    <div className="guide-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <div className="step-title">의심 문자 확인</div>
                        <div className="step-desc">
                          • 출처가 불분명한 URL 링크 클릭 금지<br />
                          • 개인정보 입력 요구 시 의심<br />
                          • 공공기관을 사칭한 문자 주의
                        </div>
                      </div>
                    </div>

                    <div className="guide-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <div className="step-title">신고하기</div>
                        <div className="step-desc">
                          • 해당 문자를 118로 전달<br />
                          • 경찰청 사이버안전국 (국번없이 182)<br />
                          • 한국인터넷진흥원 (118)
                        </div>
                      </div>
                    </div>

                    <div className="guide-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <div className="step-title">추가 피해 방지</div>
                        <div className="step-desc">
                          • 링크 클릭 시 즉시 백신 검사<br />
                          • 금융거래 비밀번호 즉시 변경<br />
                          • 보안카드 재발급 신청
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary">118 신고하기</button>
                </div>
              </>
            )}

            {activeModal === 'usedphone' && (
              <>
                <div className="modal-header">
                  <h2>중고폰 판매</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="input-group">
                    <label className="input-label">제조사 선택</label>
                    <select className="input-field">
                      <option>삼성</option>
                      <option>애플</option>
                      <option>LG</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">모델명</label>
                    <select className="input-field">
                      <option>갤럭시 S23 Ultra</option>
                      <option>갤럭시 S23+</option>
                      <option>갤럭시 S23</option>
                      <option>iPhone 15 Pro Max</option>
                      <option>iPhone 15 Pro</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">용량</label>
                    <select className="input-field">
                      <option>256GB</option>
                      <option>512GB</option>
                      <option>1TB</option>
                    </select>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', margin: '24px 0' }}>
                    <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>예상 판매가</div>
                    <div style={{ fontSize: '36px', fontWeight: '800' }}>최대 350,000원</div>
                  </div>

                  <div className="guide-steps">
                    <div className="guide-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <div className="step-title">무료 방문 수거</div>
                        <div className="step-desc">편한 시간에 방문 수거 신청</div>
                      </div>
                    </div>

                    <div className="guide-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <div className="step-title">전문가 검수</div>
                        <div className="step-desc">정확한 기기 상태 확인 및 가격 산정</div>
                      </div>
                    </div>

                    <div className="guide-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <div className="step-title">즉시 입금</div>
                        <div className="step-desc">검수 완료 후 당일 계좌 입금</div>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary">판매 신청하기</button>
                </div>
              </>
            )}

            {activeModal === 'search' && (
              <>
                <div className="modal-header">
                  <h2>검색</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="input-group">
                    <input type="text" className="input-field" placeholder="궁금한 내용을 검색하세요" autoFocus />
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>인기 검색어</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['요금제', '데이터', '로밍', '5G', '멤버십', '할인'].map((keyword) => (
                        <span key={keyword} style={{ padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '14px', cursor: 'pointer' }}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
