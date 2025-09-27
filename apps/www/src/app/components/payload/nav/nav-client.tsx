'use client';

import { getTranslation } from '@payloadcms/translations';
import { NavGroup, useConfig, useTranslation } from '@payloadcms/ui';
import {
  EntityType,
  formatAdminURL,
  NavGroupType,
} from '@payloadcms/ui/shared';
import LinkWithDefault from 'next/link';
import { usePathname } from 'next/navigation';
import { NavPreferences } from 'payload';
import { FC, Fragment } from 'react';
import { links } from './custom-links';
import { baseClass } from './nav';
import { getNavIcon } from './nav-icon';

type Props = {
  groups: NavGroupType[];
  navPreferences: NavPreferences | null;
};

export const NavClient: FC<Props> = ({ groups, navPreferences }) => {
  const pathname = usePathname();

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();

  const { i18n } = useTranslation();

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup
            isOpen={navPreferences?.groups?.[label]?.open}
            key={key}
            label={label}
          >
            {entities.map(({ slug, type, label }, i) => {
              let href: string;
              let id: string;

              if (type === EntityType.collection) {
                href = formatAdminURL({
                  adminRoute,
                  path: `/collections/${slug}`,
                });
                id = `nav-${slug}`;
              } else {
                href = formatAdminURL({ adminRoute, path: `/globals/${slug}` });
                id = `nav-global-${slug}`;
              }

              const Link = LinkWithDefault;

              const LinkElement = Link || 'a';
              const activeCollection =
                pathname.startsWith(href) &&
                ['/', undefined].includes(pathname[href.length]);

              const Icon = getNavIcon(slug);

              return (
                <LinkElement
                  className={[
                    `${baseClass}__link`,
                    activeCollection && `active`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={false}
                >
                  {activeCollection && (
                    <div className={`${baseClass}__link-indicator`} />
                  )}
                  {Icon && <Icon className={`${baseClass}__icon h-6 pr-2`} />}
                  <span className={`${baseClass}__link-label`}>
                    {getTranslation(label, i18n)}
                  </span>
                </LinkElement>
              );
            })}
          </NavGroup>
        );
      })}
      <NavGroup label='Admin'>
        {links.map(({ label, href }, i) => {
          const Link = LinkWithDefault;

          const activeCollection =
            pathname.startsWith(href) &&
            ['/', undefined].includes(pathname[href.length]);

          const Icon = getNavIcon(label);

          return (
            <Link
              className={[`${baseClass}__link`, activeCollection && `active`]
                .filter(Boolean)
                .join(' ')}
              href={href}
              id={href}
              key={i}
              prefetch={false}
            >
              {activeCollection && (
                <div className={`${baseClass}__link-indicator`} />
              )}
              {Icon && <Icon className={`${baseClass}__icon h-6 pr-2`} />}
              <span className={`${baseClass}__link-label`}>
                {getTranslation(label, i18n)}
              </span>
            </Link>
          );
        })}
      </NavGroup>
    </Fragment>
  );
};
