import { GetServerSideProps } from 'next';
import ReportDisplay from './reportDisplay';

const PaymentMethodsReport: React.FC = () => {
  return <ReportDisplay reportType="vendas-forma-pagamento" />;
};

export default PaymentMethodsReport;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};