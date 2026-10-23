"use client";

import {
  ArrowRight,
  CircleCheck,
  Clock3,
  History,
  Medal,
  Shield,
  ShoppingCart,
  UserRound,
  UsersRound,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Jogadores",
    text: "Nascem livres e Aptos; o valor de mercado vem da condição, agilidade e idade.",
    icon: UsersRound,
  },
  {
    number: "02",
    title: "Clubes",
    text: "Começam com 300,00 em caixa e sem jogadores.",
    icon: Shield,
  },
  {
    number: "03",
    title: "Compra",
    text: "Valor + taxa, até 50% do caixa, com contrato de fidelidade.",
    icon: ShoppingCart,
  },
  {
    number: "04",
    title: "Venda",
    text: "Multa antes do fim da fidelidade e comissão sobre o lucro.",
    icon: UsersRound,
  },
  {
    number: "05",
    title: "Histórico",
    text: "Toda compra e venda fica registrada, com totais e CSV.",
    icon: History,
  },
  {
    number: "06",
    title: "Liga",
    text: "Escale 5 titulares e jogue partidas que entram na classificação.",
    icon: Medal,
  },
];

export default function Home() {
  return (
    <main className="landing">
      <section className="pitch-shell" aria-labelledby="hero-title">
        <div className="pitch-lines" aria-hidden="true">
          <span className="midline" />
          <span className="center-circle" />
          <span className="left-box" />
          <span className="right-box" />
          <span className="left-goal" />
          <span className="right-goal" />
          <span className="left-dot" />
          <span className="right-dot" />
        </div>

        <header className="brand" aria-label="Passe">
          <span className="brand-mark">
            p<span>•</span>
          </span>
          <span>Passe</span>
        </header>

        <div className="hero">
          <p className="league-chip">
            <i /> <strong>Liga Fictícia 2026</strong>
            <span>·</span> líder: Delta FC, 6 pontos
          </p>
          <h1 id="hero-title">Gestão da liga, do mercado à classificação</h1>
          <p className="subtitle">
            Cadastre jogadores, monte os clubes e negocie com contrato de
            fidelidade. Depois,
            <br className="desktop-break" /> escale os titulares e jogue
            partidas com placar calculado pelos atributos.
          </p>
          <div className="start-row">
            <a className="start-button" href="#etapas">
              Iniciar <ArrowRight size={18} strokeWidth={2.25} />
            </a>
            <span>
              ou tecle <kbd>Enter</kbd>
            </span>
          </div>
          <div className="metrics" aria-label="Resumo da liga">
            <span>
              <UsersRound /> <b>23</b> jogadores
            </span>
            <i />
            <span>
              <UserRound /> <b>7</b> livres
            </span>
            <i />
            <span>
              <Shield /> <b>6</b> clubes
            </span>
            <i />
            <span>
              <Medal /> <b>2</b> partidas
            </span>
            <i />
            <span>
              <CircleCheck /> Não precisa de login
            </span>
          </div>
        </div>

        <ol className="steps" id="etapas">
          {steps.map(({ number, title, text, icon: Icon }, index) => (
            <li key={title} className="step">
              <div className="step-top">
                <span className="icon-wrap">
                  <Icon size={18} />
                </span>
                <span>{number}</span>
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="step-arrow" size={19} />
              )}
            </li>
          ))}
        </ol>

        <footer>
          <Clock3 size={17} /> Liga Fictícia 2026 · Horário de Brasília (UTC−3)
        </footer>
      </section>
    </main>
  );
}
