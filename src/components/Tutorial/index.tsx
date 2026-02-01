import React from "react";
import { Link } from "react-router-dom";

export default function Tutorial() {
  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <div className="bg-limitdiff-card border-gradient border border-white/10 rounded-2xl p-8 shadow-card space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2 glow-text-cyan">使い方ガイド</h1>
          <p className="text-ui-muted text-sm">
            極限・微分をグラフで確認できるアプリの操作説明です。
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-accent-cyan border-b border-accent-cyan/30 pb-2">
            このアプリについて
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            関数 f(x) とその導関数 f'(x) をグラフで表示します。x や x+h を動かして、極限や微分係数の意味を視覚的に理解できます。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-accent-cyan border-b border-accent-cyan/30 pb-2">
            1. 極限・微分（x² / x³）ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/" className="text-accent-cyan hover:text-white transition-colors">このページ</Link>
            では、あらかじめ用意された多項式（x², x³, x⁴）を選んで使います。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-2 ml-1">
            <li>
              <strong className="text-white">関数の種類</strong>：上部の「x²」「x³」「x⁴」ボタンで f(x) を切り替えます。
            </li>
            <li>
              <strong className="text-white">x のスライダー</strong>：点 x の位置を変えます。グラフ上の点と f(x) の値が連動します。
            </li>
            <li>
              <strong className="text-white">x + h のスライダー</strong>：もう一つの点 x+h の位置です。極限 h→0 のイメージを確認できます。
            </li>
            <li>
              <strong className="text-white">グラフ</strong>：上が f(x)、下が f'(x) です。軸のメモリで値の目安が分かります。
            </li>
            <li>
              <strong className="text-white">拡大・縮小</strong>：グラフ下の − / スライダー / + で表示範囲を変更できます。「リセット」で初期状態に戻ります。
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-accent-purple border-b border-accent-purple/30 pb-2">
            2. 自分で関数を指定ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/custom" className="text-accent-purple hover:text-white transition-colors">このページ</Link>
            では、x⁴, x³, x², x, 定数項を組み合わせて、自分で多項式 f(x) を作れます。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-2 ml-1">
            <li>
              <strong className="text-white">項の追加</strong>：「x⁴」「x³」「x²」「x」「定数項」のどれかを押すと、係数（または定数）を入力する欄が出ます。数字を入れて「追加」で項が加わります。
            </li>
            <li>
              <strong className="text-white">係数</strong>：半角・全角・漢数字（一二三など）で入力でき、自動で半角に変換されます。先頭の 0 も自動で整理されます（例：0123 → 123）。
            </li>
            <li>
              <strong className="text-white">同じ種類の項</strong>：同じ次数の項は自動でまとまり、降べきの順で表示されます。
            </li>
            <li>
              <strong className="text-white">最後の項を消す</strong>：いちばん最後に追加した項だけを削除できます。
            </li>
            <li>
              <strong className="text-white">x の値</strong>：スライダーか数値入力で x を変えられます。f(x) と f'(x) の値がその場で表示されます。
            </li>
            <li>
              <strong className="text-white">グラフ・ズーム・リセット</strong>：極限・微分ページと同様に、グラフの拡大縮小とリセットが使えます。
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-accent-pink border-b border-accent-pink/30 pb-2">
            3. 自分で導関数を指定ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/derivative" className="text-accent-pink hover:text-white transition-colors">このページ</Link>
            では、f'(x) を項で指定すると、積分によって f(x) が自動で求まります（関数指定の逆バージョン）。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-2 ml-1">
            <li>
              <strong className="text-white">f'(x) の項を追加</strong>：x⁴, x³, x², x, 定数項を選んで係数を入力し、f'(x) を組み立てます。
            </li>
            <li>
              <strong className="text-white">積分定数 C</strong>：∫f'(x)dx には積分定数が含まれます。C の値を指定すると f(x) のグラフが上下にシフトします。
            </li>
            <li>
              <strong className="text-white">f(x) の表示</strong>：f'(x) から積分して得られた f(x) の式と、そのグラフが表示されます。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-accent-orange border-b border-accent-orange/30 pb-2">
            ヒント
          </h2>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-1.5 ml-1">
            <li>数値入力では「0.5」のように小数点も入力できます。</li>
            <li>負の係数は「−」を付けて入力します（例：-2）。</li>
            <li>画面上部のリンクで、各ページを切り替えられます。</li>
          </ul>
        </section>

        <div className="pt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-xl px-5 py-2.5 bg-gradient-to-r from-accent-cyan/20 to-accent-cyan/10 text-accent-cyan border border-accent-cyan/40 hover:from-accent-cyan/30 hover:to-accent-cyan/20 hover:shadow-glow-cyan transition-all duration-200 font-medium"
          >
            極限・微分（x² / x³）を開く
          </Link>
          <Link
            to="/custom"
            className="inline-flex items-center rounded-xl px-5 py-2.5 bg-gradient-to-r from-accent-purple/20 to-accent-purple/10 text-accent-purple border border-accent-purple/40 hover:from-accent-purple/30 hover:to-accent-purple/20 hover:shadow-glow-purple transition-all duration-200 font-medium"
          >
            自分で関数を指定を開く
          </Link>
          <Link
            to="/derivative"
            className="inline-flex items-center rounded-xl px-5 py-2.5 bg-gradient-to-r from-accent-pink/20 to-accent-pink/10 text-accent-pink border border-accent-pink/40 hover:from-accent-pink/30 hover:to-accent-pink/20 hover:shadow-glow-pink transition-all duration-200 font-medium"
          >
            自分で導関数を指定を開く
          </Link>
        </div>
      </div>
    </div>
  );
}
