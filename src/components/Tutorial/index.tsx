import React from "react";
import { Link } from "react-router-dom";

export default function Tutorial() {
  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <div className="bg-limitdiff-panel rounded-xl p-6 shadow-lg space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white mb-1">使い方ガイド</h1>
          <p className="text-ui-muted text-sm">
            極限・微分をグラフで確認できるアプリの操作説明です。
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-200 border-b border-white/15 pb-1">
            このアプリについて
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            関数 f(x) とその導関数 f'(x) をグラフで表示します。x や x+h を動かして、極限や微分係数の意味を視覚的に理解できます。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-cyan-200 border-b border-white/15 pb-1">
            1. 極限・微分（x² / x³）ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/" className="text-cyan-400 hover:underline">このページ</Link>
            では、あらかじめ用意された多項式（x², x³, x⁴）を選んで使います。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-1.5 ml-1">
            <li>
              <strong className="text-ui-base">関数の種類</strong>：上部の「x²」「x³」「x⁴」ボタンで f(x) を切り替えます。
            </li>
            <li>
              <strong className="text-ui-base">x のスライダー</strong>：点 x の位置を変えます。グラフ上の点と f(x) の値が連動します。
            </li>
            <li>
              <strong className="text-ui-base">x + h のスライダー</strong>：もう一つの点 x+h の位置です。極限 h→0 のイメージを確認できます。
            </li>
            <li>
              <strong className="text-ui-base">グラフ</strong>：上が f(x)、下が f'(x) です。軸のメモリで値の目安が分かります。
            </li>
            <li>
              <strong className="text-ui-base">拡大・縮小</strong>：グラフ下の − / スライダー / + で表示範囲を変更できます。「リセット」で初期状態に戻ります。
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-cyan-200 border-b border-white/15 pb-1">
            2. 自分で関数を指定ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/custom" className="text-cyan-400 hover:underline">このページ</Link>
            では、x⁴, x³, x², x, 定数項を組み合わせて、自分で多項式 f(x) を作れます。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-1.5 ml-1">
            <li>
              <strong className="text-ui-base">項の追加</strong>：「x⁴」「x³」「x²」「x」「定数項」のどれかを押すと、係数（または定数）を入力する欄が出ます。数字を入れて「追加」で項が加わります。
            </li>
            <li>
              <strong className="text-ui-base">係数</strong>：半角・全角・漢数字（一二三など）で入力でき、自動で半角に変換されます。先頭の 0 も自動で整理されます（例：0123 → 123）。
            </li>
            <li>
              <strong className="text-ui-base">同じ種類の項</strong>：同じ次数の項は自動でまとまり、降べきの順で表示されます。
            </li>
            <li>
              <strong className="text-ui-base">最後の項を消す</strong>：いちばん最後に追加した項だけを削除できます。
            </li>
            <li>
              <strong className="text-ui-base">x の値</strong>：スライダーか数値入力で x を変えられます。f(x) と f'(x) の値がその場で表示されます。
            </li>
            <li>
              <strong className="text-ui-base">グラフ・ズーム・リセット</strong>：極限・微分ページと同様に、グラフの拡大縮小とリセットが使えます。
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-cyan-200 border-b border-white/15 pb-1">
            3. 自分で導関数を指定ページ
          </h2>
          <p className="text-ui-base text-sm leading-relaxed">
            <Link to="/derivative" className="text-cyan-400 hover:underline">このページ</Link>
            では、f'(x) を項で指定すると、積分によって f(x) が自動で求まります（関数指定の逆バージョン）。
          </p>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-1.5 ml-1">
            <li>
              <strong className="text-ui-base">f'(x) の項を追加</strong>：x⁴, x³, x², x, 定数項を選んで係数を入力し、f'(x) を組み立てます。
            </li>
            <li>
              <strong className="text-ui-base">積分定数 C</strong>：∫f'(x)dx には積分定数が含まれます。C の値を指定すると f(x) のグラフが上下にシフトします。
            </li>
            <li>
              <strong className="text-ui-base">f(x) の表示</strong>：f'(x) から積分して得られた f(x) の式と、そのグラフが表示されます。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-200 border-b border-white/15 pb-1">
            ヒント
          </h2>
          <ul className="list-disc list-inside text-ui-base text-sm space-y-1 ml-1">
            <li>数値入力では「0.5」のように小数点も入力できます。</li>
            <li>負の係数は「−」を付けて入力します（例：-2）。</li>
            <li>画面上部のリンクで、各ページを切り替えられます。</li>
          </ul>
        </section>

        <div className="pt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-lg px-4 py-2 bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/50"
          >
            極限・微分（x² / x³）を開く
          </Link>
          <Link
            to="/custom"
            className="inline-flex items-center rounded-lg px-4 py-2 bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/50"
          >
            自分で関数を指定を開く
          </Link>
          <Link
            to="/derivative"
            className="inline-flex items-center rounded-lg px-4 py-2 bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/50"
          >
            自分で導関数を指定を開く
          </Link>
        </div>
      </div>
    </div>
  );
}
