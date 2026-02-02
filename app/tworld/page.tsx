'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function TworldPage() {
  useEffect(() => {
    // model-viewer 스크립트 동적 로드
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
    document.head.appendChild(script)

    return () => {
      // cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

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
        .logo { font-size: 28px; font-weight: 800; color: var(--t-blue); cursor: pointer; }
        .nav { display: flex; gap: 40px; }
        .nav a { text-decoration: none; color: var(--text-black); font-size: 17px; font-weight: 600; }
        .nav a:hover { color: var(--t-blue); }
        .user-menu { font-size: 14px; color: var(--text-gray); }

        /* Main Section */
        .container { max-width: 1080px; margin: 40px auto; padding: 0 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .section-header h2 { font-size: 24px; font-weight: 700; }
        .section-header .more { font-size: 14px; color: var(--text-gray); text-decoration: none; }

        /* Quick Menu Grid */
        .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
        .quick-card { background: #fff; padding: 32px 20px; border-radius: 20px; text-align: center; transition: all 0.3s ease; border: 1px solid transparent; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .quick-card:hover { border-color: var(--t-blue); transform: translateY(-4px); box-shadow: 0 8px 20px rgba(54,23,206,0.1); }
        .quick-card .icon-box { width: 56px; height: 56px; background: #F2F0FF; border-radius: 18px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .quick-card span { display: block; font-weight: 600; font-size: 16px; }

        /* Banner Section */
        .banner { background: var(--t-blue); border-radius: 24px; padding: 40px; color: #fff; margin-bottom: 48px; position: relative; overflow: hidden; }
        .banner h3 { font-size: 28px; margin-bottom: 12px; font-weight: 700; line-height: 1.3; }
        .banner p { font-size: 16px; opacity: 0.9; }
        .banner .btn-white { display: inline-block; margin-top: 24px; background: #fff; color: var(--t-blue); padding: 12px 24px; border-radius: 30px; font-weight: 700; text-decoration: none; font-size: 15px; }

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
          z-index: 200;
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
          z-index: 201;
          pointer-events: none;
        }
        .character-container model-viewer {
          width: 100%;
          height: 100%;
          display: block;
        }

      `}</style>

      <header className="tworld-header">
        <div className="header-inner">
          <div className="logo">T world</div>
          <nav className="nav">
            <a href="#">T 다이렉트샵</a>
            <a href="#">MY</a>
            <a href="#">혜택</a>
            <a href="#">메뉴</a>
          </nav>
          <div className="user-menu">로그인 | 회원가입 | 검색</div>
        </div>
      </header>

      <div className="container">
        <div className="section-header">
          <h2>자주 찾는 메뉴</h2>
        </div>
        <div className="quick-grid">
          <div className="quick-card">
            <div className="icon-box">📄</div>
            <span>요금제 변경</span>
          </div>
          <div className="quick-card">
            <div className="icon-box">📊</div>
            <span>실시간 잔여량</span>
          </div>
          <div className="quick-card">
            <div className="icon-box">💳</div>
            <span>요금 납부</span>
          </div>
          <div className="quick-card">
            <div className="icon-box">🎁</div>
            <span>멤버십 혜택</span>
          </div>
        </div>

        <div className="banner">
          <h3>데이터가 모자랄 땐?<br />T끼리 데이터 선물하기</h3>
          <p>가족, 친구에게 마음을 전해보세요.</p>
          <a href="#" className="btn-white">선물하러 가기</a>
        </div>

        <div className="section-header">
          <h2>이럴 땐 이렇게 해 보세요</h2>
          <a href="#" className="more">전체보기 &gt;</a>
        </div>
        <div className="info-grid">
          <div className="info-card">
            <div className="img-placeholder">🛡️</div>
            <div className="info-text">
              <div className="title">스미싱 대처 방법</div>
              <div className="desc">의심스러운 문자를 받았을 때<br />안전하게 대처하는 가이드를 확인하세요.</div>
            </div>
          </div>
          <div className="info-card">
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
      <Link href="/chat" className="chatbot-button">
        <div className="icon">💬</div>
      </Link>

      {/* 3D Character */}
      <div
        className="character-container"
        suppressHydrationWarning
      >
        <model-viewer
          src="/Tworld/models/model_bye.glb"
          camera-orbit="0deg 75deg 105%"
          animation-name="*"
          autoplay
          loop
          suppressHydrationWarning>
        </model-viewer>
      </div>
    </>
  )
}
