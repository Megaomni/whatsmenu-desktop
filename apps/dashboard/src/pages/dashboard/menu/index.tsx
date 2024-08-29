import { MenuProvider } from "../../../context/menu.ctx";
import { MenuComponent } from "../../../components/Menu";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { apiRoute } from "../../../utils/wm-functions";
import Category from "../../../types/category";
import Complement from "../../../types/complements";
interface IMenu {
  categories: Category[];
  allComplements: Complement[];
}
interface MenuProps {
  menu: IMenu;
}

export default function Menu(props: MenuProps) {
  const { menu } = props;
  menu.categories = menu.categories.map((cat) => new Category(cat));

  return (
    <MenuProvider props={menu}>
      <MenuComponent />
    </MenuProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  const { data: menu } = await apiRoute("/dashboard/api/menu", session);
  return {
    props: { menu }
  };
};
