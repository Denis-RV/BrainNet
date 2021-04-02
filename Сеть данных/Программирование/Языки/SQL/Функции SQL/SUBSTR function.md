==SUBSTR(s, start position, `number of characters`)== - из строки s с позиции start выбираем и возвращаем текст. Также можно указать количество символов. 

***Примеры:***
```sql
SQL> select email, substr(email, 4, 2) from EMPLOYEES;

EMAIL                     SUBSTR(E
------------------------- --------
ABANDA                    ND
ABULL                     LL
ACABRIO                   BR
```

Можно использовать отрицательные числа, чтобы выводить с другого конца:
```sql
SQL> select SUBSTR('privet, kak dela?', -5) from dual;   
SUBST
-----
dela?
```

---
*теги:* #базы_данных, #sql/function/single-row/character 