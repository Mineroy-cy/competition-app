import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, CheckSquare, Users, Rocket } from 'lucide-react';

const Landing = () => {
  const steps = [
    {
      title: 'Pick your goals',
      text: 'Choose what you want to finish this week. Keep it simple and clear.',
      icon: <Flag size={20} className="text-brand-primary" />,
    },
    {
      title: 'Add small tasks',
      text: 'Break each goal into small tasks so it is easy to start and finish.',
      icon: <CheckSquare size={20} className="text-brand-secondary" />,
    },
    {
      title: 'Grow with your group',
      text: 'Invite friends, vote on streak freeze requests, and stay accountable together.',
      icon: <Users size={20} className="text-brand-accent" />,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 px-4 py-8 md:py-14">
      <div className="max-w-5xl mx-auto">
        <header className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden border border-dark-border">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 blur-[90px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-secondary/20 blur-[90px]" />

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Competition App</p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-white max-w-3xl">
              Do your goals daily, track your streak, and win your week.
            </h1>
            <p className="text-sm md:text-lg text-gray-300 mt-4 max-w-2xl">
              This app helps you plan goals, finish tasks, and stay consistent with your group.
              If you are new, we guide you from setup to your first completed task.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login?mode=signup"
                className="btn-primary px-5 py-3 text-center inline-flex items-center justify-center gap-2"
              >
                <Rocket size={18} />
                Create Account
              </Link>
              <Link
                to="/login"
                className="btn-secondary px-5 py-3 text-center inline-flex items-center justify-center"
              >
                I Already Have An Account
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((step) => (
            <article key={step.title} className="glass-panel rounded-2xl p-5 border border-dark-border">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-dark-border flex items-center justify-center mb-3">
                {step.icon}
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{step.title}</h2>
              <p className="text-sm text-gray-400">{step.text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Landing;
