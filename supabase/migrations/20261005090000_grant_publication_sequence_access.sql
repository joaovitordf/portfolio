-- Publication assigns the identity sequence while running as the dedicated
-- editorial executor. The table INSERT grant alone is not enough for nextval.
grant usage, select on sequence portfolio_editorial.publications_sequence_seq
  to portfolio_editorial_executor;
