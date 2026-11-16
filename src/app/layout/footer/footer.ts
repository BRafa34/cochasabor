import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';
@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icon],
  template: ` <footer>
    <div class="container">
      <div class="top">
        <div>
          <a class="brand" routerLink="/">Cocha<span>Sabor.</span></a>
          <p>El sabor de nuestra tierra.<br />Las historias de nuestros lugares.</p>
        </div>
        <div class="links">
          <a routerLink="/lugares">Explorar lugares</a><a routerLink="/favoritos">Mis favoritos</a
          ><a routerLink="/acceso">Mi perfil</a>
        </div>
        <div class="made">
          <app-icon name="pin" /><span
            >Hecho para descubrir<br /><strong>Cochabamba, Bolivia</strong></span
          >
        </div>
      </div>
      <div class="bottom">
        <span>© 2026 CochaSabor · Un proyecto con sabor local</span
        ><span class="demo">Datos de demostración · Fotografías ilustrativas</span>
      </div>
    </div>
  </footer>`,
  styles: `
    footer {
      padding: 48px 0 22px;
      background: #eeede3;
      border-top: 1px solid var(--border);
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      padding-bottom: 32px;
    }
    .brand {
      font:
        700 1.8rem Georgia,
        serif;
      text-decoration: none;
      letter-spacing: -1px;
    }
    .brand span {
      color: var(--terracotta);
    }
    p {
      font-size: 0.83rem;
      color: var(--muted);
      line-height: 1.8;
      margin: 13px 0 0;
    }
    .links {
      display: flex;
      gap: 26px;
      align-items: center;
      font-size: 0.8rem;
    }
    .links a {
      text-decoration: none;
      min-height: 44px;
      display: flex;
      align-items: center;
    }
    .made {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.8rem;
      line-height: 1.8;
    }
    .made app-icon {
      color: var(--terracotta);
      width: 26px;
      height: 26px;
    }
    .bottom {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      border-top: 1px solid #d9dccf;
      padding-top: 20px;
      font-size: 0.68rem;
      color: #5d645a;
    }
    .demo {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .demo:before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--green);
      border-radius: 50%;
    }
    @media (max-width: 800px) {
      .top {
        flex-wrap: wrap;
      }
      .links {
        flex-wrap: wrap;
        gap: 18px;
      }
      .bottom {
        flex-direction: column;
      }
      .made {
        width: 100%;
      }
    }
  `,
})
export class Footer {}
